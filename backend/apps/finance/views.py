from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Q, Count
from decimal import Decimal

from .models import Collection, Expense
from apps.events.models import EventMember
from .serializers import (
    CollectionSerializer, CollectionCreateSerializer, CollectionListSerializer,
    ExpenseSerializer, ExpenseCreateSerializer, ExpenseListSerializer,
    FinanceSummarySerializer
)
from apps.users.rbac import resolve_user_roles


def _has_any_role(user, event_id, allowed_roles):
    user_roles = resolve_user_roles(user, event_id)
    return bool(user_roles.intersection(set(allowed_roles)))


class CollectionViewSet(viewsets.ModelViewSet):
    """ViewSet for Collection CRUD operations with Phase 5 enhancements"""
    
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Collection.objects.all()
        
        # Filter by event
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by cluster
        cluster_id = self.request.query_params.get('cluster')
        if cluster_id:
            queryset = queryset.filter(cluster_id=cluster_id)
        
        # Filter by source type
        source_type = self.request.query_params.get('source_type')
        if source_type:
            queryset = queryset.filter(source_type=source_type)
        
        # Filter by committee
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CollectionListSerializer
        elif self.action == 'create':
            return CollectionCreateSerializer
        return CollectionSerializer

    def create(self, request, *args, **kwargs):
        event_id = request.data.get('event')
        if not _has_any_role(
            request.user,
            event_id,
            {'chair', 'secretary', 'treasurer', 'finance_member', 'executive_admin'}
        ):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_event(self, request):
        """Get all collections for a specific event"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        collections = Collection.objects.filter(event_id=event_id)
        serializer = CollectionListSerializer(collections, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def cluster_summary(self, request):
        """Get collections summary by cluster for an event"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        collections = Collection.objects.filter(
            event_id=event_id,
            source_type='CLUSTER'
        ).values('cluster__name', 'cluster__id').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return Response(list(collections))


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for Expense CRUD operations with Phase 5 3-tier approval"""
    
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Expense.objects.all()
        
        # Filter by event
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by budget item
        budget_item_id = self.request.query_params.get('budget_item')
        if budget_item_id:
            queryset = queryset.filter(budget_item_id=budget_item_id)
        
        # Filter by committee
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        # Filter by status
        expense_status = self.request.query_params.get('status')
        if expense_status:
            queryset = queryset.filter(status=expense_status)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ExpenseListSerializer
        elif self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def create(self, request, *args, **kwargs):
        event_id = request.data.get('event')
        if not _has_any_role(
            request.user,
            event_id,
            {
                'chair',
                'secretary',
                'treasurer',
                'finance_member',
                'subcommittee_lead',
                'executive_admin',
            },
        ):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user, status='PENDING')

    def _get_event_role(self, user, event_id):
        membership = EventMember.objects.filter(
            event_id=event_id,
            user=user,
            is_active=True,
        ).first()
        return membership.role if membership else None

    def _is_admin(self, user):
        return user.role == 'ADMIN'

    def _can_approve_as_chair(self, user, event_id):
        return self._is_admin(user) or _has_any_role(user, event_id, {'chair', 'executive_admin'})

    def _can_approve_as_treasurer(self, user, event_id):
        return self._is_admin(user) or _has_any_role(user, event_id, {'treasurer', 'executive_admin'})

    def _can_approve_as_finance(self, user):
        return self._is_admin(user) or _has_any_role(user, None, {'finance_member', 'executive_admin'})

    def _can_reject(self, user, event_id):
        return self._is_admin(user) or _has_any_role(
            user,
            event_id,
            {'chair', 'treasurer', 'finance_member', 'executive_admin'},
        )
    
    @action(detail=True, methods=['post'])
    def approve_as_chair(self, request, pk=None):
        """Chairman approves expense (1st tier)"""
        expense = self.get_object()

        if not self._can_approve_as_chair(request.user, expense.event_id):
            return Response({
                'error': 'Only event Chairman can perform chair approval'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if expense.status != 'PENDING':
            return Response({
                'error': 'Only pending expenses can be approved by chairman'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expense.approved_by_chair = request.user
        expense.status = 'APPROVED_CHAIR'
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def approve_as_treasurer(self, request, pk=None):
        """Treasurer approves expense (2nd tier)"""
        expense = self.get_object()

        if not self._can_approve_as_treasurer(request.user, expense.event_id):
            return Response({
                'error': 'Only event Treasurer can perform treasurer approval'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if expense.status != 'APPROVED_CHAIR':
            return Response({
                'error': 'Expense must be approved by chairman first'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expense.approved_by_treasurer = request.user
        expense.status = 'APPROVED_TREASURER'
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def approve_as_finance(self, request, pk=None):
        """Finance member approves expense (3rd tier)"""
        expense = self.get_object()

        if not self._can_approve_as_finance(request.user):
            return Response({
                'error': 'Only finance members can perform this action'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if expense.status != 'APPROVED_TREASURER':
            return Response({
                'error': 'Expense must be approved by treasurer first'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expense.approved_by_finance = request.user
        expense.status = 'FULLY_APPROVED'
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an expense (any tier can reject)"""
        expense = self.get_object()

        if not self._can_reject(request.user, expense.event_id):
            return Response({
                'error': 'Only Chairman, Treasurer, or Finance Committee can reject requisitions'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if expense.status == 'PAID':
            return Response({
                'error': 'Paid expenses cannot be rejected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expense.status = 'REJECTED'
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark expense as paid and update budget"""
        expense = self.get_object()

        if not self._can_approve_as_treasurer(request.user, expense.event_id):
            return Response({
                'error': 'Only event Treasurer can execute payment'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if expense.status != 'FULLY_APPROVED':
            return Response({
                'error': 'Only fully approved expenses can be marked as paid'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark as paid
        expense.status = 'PAID'
        expense.paid_at = timezone.now()
        expense.save()
        
        # Update budget item spent amount
        if expense.budget_item:
            expense.budget_item.spent_amount += expense.amount
            expense.budget_item.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get expenses pending approval (by current user's role)"""
        event_id = request.query_params.get('event_id')
        if not _has_any_role(
            request.user,
            event_id,
            {'chair', 'treasurer', 'finance_member', 'executive_admin'}
        ):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        expenses = Expense.objects.filter(
            status__in=['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER']
        )
        
        # Filter by event if provided
        if event_id:
            expenses = expenses.filter(event_id=event_id)
        
        serializer = ExpenseListSerializer(expenses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_budget_item(self, request):
        """Get expenses for a specific budget item"""
        budget_item_id = request.query_params.get('budget_item_id')
        
        if not budget_item_id:
            return Response({
                'error': 'budget_item_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expenses = Expense.objects.filter(budget_item_id=budget_item_id)
        serializer = ExpenseListSerializer(expenses, many=True)
        
        return Response(serializer.data)


class FinanceViewSet(viewsets.ViewSet):
    """ViewSet for finance summary and reports with Phase 5 enhancements"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get comprehensive finance summary for an event"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Collections
        collections = Collection.objects.filter(event_id=event_id)
        total_collections = collections.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        cluster_collections = collections.filter(
            source_type='CLUSTER'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        general_collections = collections.filter(
            source_type='GENERAL'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Expenses
        expenses = Expense.objects.filter(event_id=event_id)
        
        total_expenses = expenses.filter(
            status='PAID'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        pending_expenses = expenses.filter(
            status__in=['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        approved_expenses = expenses.filter(
            status='FULLY_APPROVED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        paid_expenses = expenses.filter(
            status='PAID'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Expenses by status
        expenses_by_status = {}
        for choice in Expense.STATUS_CHOICES:
            status_key = choice[0]
            count = expenses.filter(status=status_key).count()
            total = expenses.filter(status=status_key).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            expenses_by_status[status_key] = {
                'count': count,
                'total': float(total)
            }
        
        balance = total_collections - total_expenses
        
        # Build nested structure to match frontend expectations
        data = {
            'collections': {
                'total': str(total_collections),
                'cluster': str(cluster_collections),
                'general': str(general_collections),
            },
            'expenses': {
                'total': str(total_expenses),
                'paid': str(paid_expenses),
                'pending': str(pending_expenses),
                'fully_approved': str(approved_expenses),
                'awaiting_approval': '0.00',  # Can be calculated if needed
            },
            'balance': str(balance),
            'expenses_by_status': expenses_by_status,
            'event_id': str(event_id),
        }
        
        serializer = FinanceSummarySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def budget_vs_actual(self, request):
        """Compare budget allocation vs actual spending"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.events.models import BudgetItem
        
        budget_items = BudgetItem.objects.filter(event_id=event_id, status='APPROVED')
        
        report = []
        for item in budget_items:
            report.append({
                'item_name': item.item_name,
                'allocated': float(item.allocated_amount),
                'spent': float(item.spent_amount),
                'remaining': float(item.allocated_amount - item.spent_amount),
                'utilization_percentage': float(item.utilization_percentage)
            })
        
        return Response(report)
