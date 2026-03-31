from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Sum, Avg, Q, Count, F
from decimal import Decimal

from .models import Committee, CommitteeMember
from .serializers import (
    CommitteeSerializer, CommitteeCreateSerializer, CommitteeListSerializer,
    CommitteeMemberSerializer, AddMemberSerializer, CommitteeBudgetSerializer
)
from apps.events.models import BudgetItem
from apps.events.serializers import BudgetItemSerializer, BudgetItemCreateSerializer
from apps.users.rbac import resolve_user_roles

User = get_user_model()


def _can_manage_event_members(user, event_id):
    roles = resolve_user_roles(user, event_id)
    return bool(roles.intersection({'chair', 'secretary'}))


class CommitteeViewSet(viewsets.ModelViewSet):
    """ViewSet for Committee CRUD operations with Phase 5 enhancements"""
    
    queryset = Committee.objects.all()
    serializer_class = CommitteeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Committee.objects.all()
        
        # Filter by event
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by committee type
        committee_type = self.request.query_params.get('committee_type')
        if committee_type:
            queryset = queryset.filter(committee_type=committee_type)
        
        # Filter main committees only
        is_main = self.request.query_params.get('is_main')
        if is_main:
            queryset = queryset.filter(is_main=is_main.lower() == 'true')
        
        # Filter by lead user
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CommitteeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CommitteeCreateSerializer
        return CommitteeSerializer
    
    def perform_create(self, serializer):
        committee = serializer.save()
        # If lead is specified, add them as a member
        if committee.lead:
            CommitteeMember.objects.get_or_create(
                committee=committee,
                user=committee.lead,
                defaults={'is_lead': True, 'role_description': 'Committee Lead'}
            )
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the committee"""
        committee = self.get_object()
        if not _can_manage_event_members(request.user, committee.event_id):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = User.objects.get(id=serializer.validated_data['user_id'])
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is already a member
        if CommitteeMember.objects.filter(committee=committee, user=user).exists():
            return Response({
                'error': 'User is already a member'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        member = CommitteeMember.objects.create(
            committee=committee,
            user=user,
            is_lead=serializer.validated_data.get('is_lead', False),
            role_description=serializer.validated_data.get('role_description', '')
        )
        
        return Response(
            CommitteeMemberSerializer(member).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove a member from the committee"""
        committee = self.get_object()
        if not _can_manage_event_members(request.user, committee.event_id):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        user_id = request.data.get('user_id')
        
        try:
            member = CommitteeMember.objects.get(committee=committee, user_id=user_id)
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CommitteeMember.DoesNotExist:
            return Response({
                'error': 'Member not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of the committee"""
        committee = self.get_object()
        members = committee.members.all()
        serializer = CommitteeMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_committees(self, request):
        """Get committees where current user is a member"""
        committees = Committee.objects.filter(
            members__user=request.user
        ).distinct()
        serializer = CommitteeSerializer(committees, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get committee operational progress based on tasks"""
        committee = self.get_object()
        
        # Get task statistics
        from apps.tasks.models import Task
        tasks = Task.objects.filter(committee=committee)
        
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='COMPLETED').count()
        
        # Calculate average progress percentage
        avg_progress = tasks.aggregate(
            avg=Avg('progress_percentage')
        )['avg'] or Decimal('0.00')
        
        return Response({
            'committee_id': committee.id,
            'committee_name': committee.name,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': tasks.filter(status='IN_PROGRESS').count(),
            'pending_tasks': tasks.filter(status='TODO').count(),
            'average_progress': float(avg_progress),
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        })
    
    @action(detail=True, methods=['get'])
    def budget_status(self, request, pk=None):
        """Get committee budget utilization"""
        committee = self.get_object()
        
        from apps.finance.models import Expense
        
        # Calculate expenses
        expenses = Expense.objects.filter(committee=committee)
        
        total_spent = expenses.filter(status='PAID').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_pending = expenses.filter(
            status__in=['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER', 'APPROVED_FINANCE', 'FULLY_APPROVED']
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        budget_allocated = committee.budget_allocation or Decimal('0.00')
        available = budget_allocated - total_spent - total_pending
        
        utilization_percentage = (total_spent / budget_allocated * 100) if budget_allocated > 0 else Decimal('0.00')
        
        serializer = CommitteeBudgetSerializer(data={
            'committee_id': committee.id,
            'committee_name': committee.name,
            'budget_allocated': budget_allocated,
            'total_spent': total_spent,
            'total_pending': total_pending,
            'available': available,
            'utilization_percentage': utilization_percentage
        })
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def budget_items(self, request, pk=None):
        """Get or create budget items for the committee"""
        committee = self.get_object()
        
        if request.method == 'GET':
            # Get all budget items for this committee
            items = BudgetItem.objects.filter(committee=committee).select_related(
                'created_by', 'approved_by'
            ).order_by('-created_at')
            serializer = BudgetItemSerializer(items, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Create a new budget item
            data = request.data.copy()
            data['committee'] = committee.id
            data['event'] = committee.event.id
            data['created_by'] = request.user.id
            
            serializer = BudgetItemCreateSerializer(data=data)
            if serializer.is_valid():
                budget_item = serializer.save()
                # Return full serializer with computed fields
                return Response(
                    BudgetItemSerializer(budget_item).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_event(self, request):
        """Get all committees for a specific event"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        committees = Committee.objects.filter(event_id=event_id)
        serializer = CommitteeListSerializer(committees, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def main_committee(self, request):
        """Get the main committee for an event"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            committee = Committee.objects.get(event_id=event_id, is_main=True)
            serializer = CommitteeSerializer(committee)
            return Response(serializer.data)
        except Committee.DoesNotExist:
            return Response({
                'error': 'Main committee not found for this event'
            }, status=status.HTTP_404_NOT_FOUND)
        except Committee.MultipleObjectsReturned:
            # Handle edge case of multiple main committees
            committee = Committee.objects.filter(event_id=event_id, is_main=True).first()
            serializer = CommitteeSerializer(committee)
            return Response(serializer.data)
