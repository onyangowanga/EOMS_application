from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from decimal import Decimal

from apps.committees.models import Committee
from apps.tasks.models import Task
from apps.finance.models import Collection, Expense
from apps.providers.models import ServiceProvider
from django.contrib.auth import get_user_model

from .serializers import (
    CommitteeReportSerializer, EventSummarySerializer, UserActivitySerializer
)

User = get_user_model()


class ReportViewSet(viewsets.ViewSet):
    """ViewSet for generating various reports"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def committee_report(self, request):
        """Generate committee activity report"""
        committee_id = request.query_params.get('committee')
        
        if not committee_id:
            return Response({
                'error': 'Committee ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            committee = Committee.objects.get(id=committee_id)
        except Committee.DoesNotExist:
            return Response({
                'error': 'Committee not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Gather statistics
        member_count = committee.members.count()
        tasks = Task.objects.filter(committee=committee)
        task_count = tasks.count()
        completed_tasks = tasks.filter(status='COMPLETED').count()
        pending_tasks = tasks.filter(status__in=['PENDING', 'IN_PROGRESS']).count()
        
        collections = Collection.objects.filter(committee=committee)
        total_collections = collections.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        expenses = Expense.objects.filter(committee=committee, status='PAID')
        total_expenses = expenses.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        balance = total_collections - total_expenses
        
        provider_count = ServiceProvider.objects.filter(committee=committee).count()
        
        report_data = {
            'committee_name': committee.name,
            'committee_id': committee.id,
            'member_count': member_count,
            'task_count': task_count,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'total_collections': total_collections,
            'total_expenses': total_expenses,
            'balance': balance,
            'provider_count': provider_count,
        }
        
        serializer = CommitteeReportSerializer(report_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def event_summary(self, request):
        """Generate event summary report"""
        committee_id = request.query_params.get('committee')
        
        if not committee_id:
            return Response({
                'error': 'Committee ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            committee = Committee.objects.get(id=committee_id)
        except Committee.DoesNotExist:
            return Response({
                'error': 'Committee not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Gather statistics
        total_members = committee.members.count()
        tasks = Task.objects.filter(committee=committee)
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='COMPLETED').count()
        
        collections = Collection.objects.filter(committee=committee)
        total_collections = collections.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        expenses = Expense.objects.filter(committee=committee, status='PAID')
        total_expenses = expenses.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        balance = total_collections - total_expenses
        providers_used = ServiceProvider.objects.filter(committee=committee).count()
        
        summary_data = {
            'committee_name': committee.name,
            'event_type': committee.event_type,
            'event_date': committee.event_date,
            'status': committee.status,
            'total_members': total_members,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'total_collections': total_collections,
            'total_expenses': total_expenses,
            'balance': balance,
            'providers_used': providers_used,
        }
        
        serializer = EventSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        """Generate user activity report"""
        user_id = request.query_params.get('user_id') or request.user.id
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Gather statistics
        committees_joined = user.committee_memberships.count()
        tasks_assigned = Task.objects.filter(assigned_to=user).count()
        tasks_completed = Task.objects.filter(
            assigned_to=user, 
            status='COMPLETED'
        ).count()
        collections_recorded = Collection.objects.filter(recorded_by=user).count()
        expenses_requested = Expense.objects.filter(requested_by=user).count()
        
        activity_data = {
            'user_id': user.id,
            'full_name': user.full_name,
            'role': user.role,
            'committees_joined': committees_joined,
            'tasks_assigned': tasks_assigned,
            'tasks_completed': tasks_completed,
            'collections_recorded': collections_recorded,
            'expenses_requested': expenses_requested,
        }
        
        serializer = UserActivitySerializer(activity_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def all_committees(self, request):
        """Generate report for all committees"""
        committees = Committee.objects.all()
        reports = []
        
        for committee in committees:
            member_count = committee.members.count()
            tasks = Task.objects.filter(committee=committee)
            task_count = tasks.count()
            completed_tasks = tasks.filter(status='COMPLETED').count()
            pending_tasks = tasks.filter(status__in=['PENDING', 'IN_PROGRESS']).count()
            
            collections = Collection.objects.filter(committee=committee)
            total_collections = collections.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            expenses = Expense.objects.filter(committee=committee, status='PAID')
            total_expenses = expenses.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            balance = total_collections - total_expenses
            provider_count = ServiceProvider.objects.filter(committee=committee).count()
            
            reports.append({
                'committee_name': committee.name,
                'committee_id': committee.id,
                'member_count': member_count,
                'task_count': task_count,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'total_collections': total_collections,
                'total_expenses': total_expenses,
                'balance': balance,
                'provider_count': provider_count,
            })
        
        serializer = CommitteeReportSerializer(reports, many=True)
        return Response(serializer.data)
