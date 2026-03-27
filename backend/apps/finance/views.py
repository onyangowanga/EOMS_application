from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Q
from decimal import Decimal

from .models import Collection, Expense
from .serializers import (
    CollectionSerializer, CollectionCreateSerializer,
    ExpenseSerializer, ExpenseCreateSerializer,
    FinanceSummarySerializer
)


class CollectionViewSet(viewsets.ModelViewSet):
    """ViewSet for Collection CRUD operations"""
    
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Collection.objects.all()
        
        # Filter by committee
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CollectionCreateSerializer
        return CollectionSerializer
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for Expense CRUD operations"""
    
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Expense.objects.all()
        
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
        if self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an expense"""
        expense = self.get_object()
        
        if expense.status != 'PENDING':
            return Response({
                'error': 'Only pending expenses can be approved'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expense.status = 'APPROVED'
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an expense"""
        expense = self.get_object()
        
        if expense.status != 'PENDING':
            return Response({
                'error': 'Only pending expenses can be rejected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expense.status = 'REJECTED'
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark expense as paid"""
        expense = self.get_object()
        
        if expense.status != 'APPROVED':
            return Response({
                'error': 'Only approved expenses can be marked as paid'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        expense.status = 'PAID'
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)


class FinanceViewSet(viewsets.ViewSet):
    """ViewSet for finance summary and reports"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get finance summary for a committee"""
        committee_id = request.query_params.get('committee')
        
        if not committee_id:
            return Response({
                'error': 'Committee ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate totals
        collections = Collection.objects.filter(committee_id=committee_id)
        expenses = Expense.objects.filter(committee_id=committee_id)
        
        total_collections = collections.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_expenses = expenses.filter(
            status='PAID'
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        pending_expenses = expenses.filter(
            status='PENDING'
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        approved_expenses = expenses.filter(
            status__in=['APPROVED', 'PAID']
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        balance = total_collections - total_expenses
        
        summary_data = {
            'total_collections': total_collections,
            'total_expenses': total_expenses,
            'pending_expenses': pending_expenses,
            'approved_expenses': approved_expenses,
            'balance': balance,
            'collection_count': collections.count(),
            'expense_count': expenses.count(),
        }
        
        serializer = FinanceSummarySerializer(summary_data)
        return Response(serializer.data)
