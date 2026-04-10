from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from collections import defaultdict

from .models import (
    Event, EventMember, ClusterGroup, ClusterContribution, ClusterDeposit,
    BudgetItem, BudgetAdjustmentRequest, EventSchedule, AuditLog, Notification
)
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventCreateSerializer,
    EventMemberSerializer,
    ClusterGroupListSerializer,
    ClusterGroupDetailSerializer,
    ClusterGroupCreateSerializer,
    ClusterContributionSerializer,
    ClusterDepositSerializer,
    BudgetItemSerializer,
    BudgetItemListSerializer,
    BudgetItemCreateSerializer,
    BudgetAdjustmentRequestSerializer,
    BudgetAdjustmentRequestCreateSerializer,
    EventScheduleSerializer,
    EventScheduleListSerializer,
    EventScheduleCreateSerializer,
    AuditLogSerializer,
    AuditLogListSerializer,
    NotificationSerializer,
    NotificationListSerializer,
    NotificationCreateSerializer
)
from apps.users.rbac import resolve_user_roles


def _has_any_role(user, event_id, allowed_roles):
    user_roles = resolve_user_roles(user, event_id)
    return bool(user_roles.intersection(set(allowed_roles)))


def _can_manage_cluster_transactions(user, cluster):
    if _has_any_role(user, cluster.event_id, {'chair', 'secretary', 'treasurer'}):
        return True
    return bool(cluster.cluster_lead_id and cluster.cluster_lead_id == user.id)


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet for Event CRUD operations"""
    
    queryset = Event.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        elif self.action == 'create':
            return EventCreateSerializer
        else:
            return EventDetailSerializer
    
    def get_queryset(self):
        """Single-event system: all authenticated users access the shared event."""
        return Event.objects.all()
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Manually update event progress"""
        event = self.get_object()
        event.update_financial_progress()
        event.update_operational_progress()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get event summary with statistics"""
        event = self.get_object()
        
        # Calculate statistics
        total_members = event.members.filter(is_active=True).count()
        officials_count = event.members.filter(
            is_active=True,
            role__in=['CHAIRMAN', 'SECRETARY', 'TREASURER', 'EVENT_OWNER']
        ).count()
        
        data = {
            'event': EventDetailSerializer(event).data,
            'statistics': {
                'total_members': total_members,
                'officials_count': officials_count,
                'regular_members': total_members - officials_count,
                'days_until_event': event.days_until_event,
                'financial_balance': float(event.financial_balance),
                'budget_utilization': float(event.total_spent / event.total_budget * 100) if event.total_budget > 0 else 0,
            }
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active events"""
        active_events = self.get_queryset().filter(status='ACTIVE')
        serializer = EventListSerializer(active_events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events"""
        from django.utils import timezone
        upcoming_events = self.get_queryset().filter(
            event_date__gt=timezone.now().date(),
            status__in=['PLANNING', 'ACTIVE']
        ).order_by('event_date')
        serializer = EventListSerializer(upcoming_events, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to an event or update their role"""
        from apps.users.models import User
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"add_member called with data: {request.data}")
        
        event = self.get_object()
        if not _has_any_role(request.user, event.id, {'executive_admin', 'chair', 'secretary', 'treasurer'}):
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        user_id = request.data.get('user_id')
        role = request.data.get('role', 'MEMBER')
        
        logger.info(f"Event: {event.id}, User ID: {user_id}, Role: {role}")
        
        if not user_id:
            logger.error("user_id not provided in request")
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if member already exists
        existing_member = EventMember.objects.filter(event=event, user=user).first()
        
        if existing_member:
            # Update role if they're already a member
            # This handles the case where creator (EVENT_OWNER) is also assigned another role
            if existing_member.role == 'EVENT_OWNER' and role != 'EVENT_OWNER':
                # Upgrade EVENT_OWNER to a more specific role
                existing_member.role = role
                existing_member.save()
                serializer = EventMemberSerializer(existing_member)
                return Response(serializer.data, status=status.HTTP_200_OK)
            elif existing_member.role != role:
                # Update role if different
                existing_member.role = role
                existing_member.save()
                serializer = EventMemberSerializer(existing_member)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # Same role - return existing member
                serializer = EventMemberSerializer(existing_member)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Create new event member
        try:
            logger.info(f"Creating EventMember for user {user.id} with role {role}")
            event_member = EventMember.objects.create(
                event=event,
                user=user,
                role=role,
                full_name=user.full_name if hasattr(user, 'full_name') else (user.username if user.username else user.phone),
                phone=user.phone if hasattr(user, 'phone') else '',
                email=user.email or '',
                is_active=True
            )
            
            logger.info(f"EventMember created successfully: {event_member.id}")
            serializer = EventMemberSerializer(event_member)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Failed to create EventMember: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e), 'details': 'Failed to create event member'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of the event"""
        event = self.get_object()
        members = event.members.filter(is_active=True)
        serializer = EventMemberSerializer(members, many=True)
        return Response(serializer.data)

    # ------------------------------------------------------------------ #
    #  Report Actions                                                      #
    # ------------------------------------------------------------------ #

    def _parse_date_filters(self, request):
        start = request.query_params.get('start_date') or None
        end   = request.query_params.get('end_date')   or None
        return start, end

    @action(detail=True, methods=['get'], url_path='reports/summary')
    def reports_summary(self, request, pk=None):
        """Aggregated event summary report"""
        from apps.tasks.models import Task
        from apps.finance.models import Collection, Expense
        from apps.committees.models import Committee
        event = self.get_object()
        start, end = self._parse_date_filters(request)

        tasks_qs = Task.objects.filter(event=event)
        if start:
            tasks_qs = tasks_qs.filter(created_at__date__gte=start)
        if end:
            tasks_qs = tasks_qs.filter(created_at__date__lte=end)

        total_tasks      = tasks_qs.count()
        completed_tasks  = tasks_qs.filter(status='COMPLETED').count()
        pending_tasks    = tasks_qs.filter(status='PENDING').count()
        in_progress      = tasks_qs.filter(status='IN_PROGRESS').count()
        overdue_tasks    = tasks_qs.filter(
            status__in=['PENDING', 'IN_PROGRESS'],
            deadline__lt=timezone.now()
        )

        total_members = event.members.filter(is_active=True).count()

        clusters = ClusterGroup.objects.filter(event=event)
        mobilisation_collected = clusters.aggregate(t=Sum('collected_amount'))['t'] or 0
        mobilisation_target = clusters.aggregate(t=Sum('target_amount'))['t'] or 0

        collections_qs = Collection.objects.filter(event=event)
        expenses_qs = Expense.objects.filter(event=event)
        if start:
            collections_qs = collections_qs.filter(created_at__date__gte=start)
            expenses_qs = expenses_qs.filter(created_at__date__gte=start)
        if end:
            collections_qs = collections_qs.filter(created_at__date__lte=end)
            expenses_qs = expenses_qs.filter(created_at__date__lte=end)

        deposits_qs = ClusterDeposit.objects.filter(cluster__event=event)
        if start:
            deposits_qs = deposits_qs.filter(created_at__date__gte=start)
        if end:
            deposits_qs = deposits_qs.filter(created_at__date__lte=end)

        direct_collections_total = collections_qs.aggregate(t=Sum('amount'))['t'] or 0
        cluster_deposits_total = deposits_qs.aggregate(t=Sum('amount'))['t'] or 0
        total_collected = float(direct_collections_total) + float(cluster_deposits_total)
        total_target = float(event.total_budget or 0)
        total_spent = expenses_qs.filter(status='PAID').aggregate(t=Sum('amount'))['t'] or 0

        daily_collections_map = defaultdict(float)
        for entry in collections_qs.order_by('created_at'):
            daily_collections_map[entry.created_at.date().isoformat()] += float(entry.amount)

        daily_collections = [
            {'label': day, 'value': value}
            for day, value in sorted(daily_collections_map.items())
        ]

        latest_contributions = []
        for entry in collections_qs.select_related('cluster').order_by('-created_at')[:10]:
            latest_contributions.append({
                'id': str(entry.id),
                'source': entry.payer_name,
                'cluster': entry.cluster.name if entry.cluster else '',
                'amount': str(entry.amount),
                'date': entry.created_at.date().isoformat(),
                'type': 'ACTUAL',
                'submission_status': 'SUBMITTED' if entry.source_type == 'CLUSTER' else 'PENDING',
            })

        largest_expenses = []
        for expense in expenses_qs.filter(status='PAID').order_by('-amount')[:10]:
            largest_expenses.append({
                'id': str(expense.id),
                'budget_item': expense.category or 'General',
                'subcommittee': expense.vendor or '-',
                'amount_approved': str(expense.amount),
                'amount_paid': str(expense.amount),
                'date_paid': expense.created_at.date().isoformat(),
                'status': 'PAID',
                'notes': expense.description or '',
            })

        pending_approvals = []
        for expense in expenses_qs.filter(status__in=['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER']).order_by('-created_at')[:10]:
            pending_approvals.append({
                'id': str(expense.id),
                'title': expense.vendor or expense.category or 'Requisition',
                'status': expense.status,
                'amount': str(expense.amount),
            })

        committees = Committee.objects.filter(event=event)
        subcommittee_progress = []
        for committee in committees:
            committee_tasks = tasks_qs.filter(committee=committee)
            committee_total = committee_tasks.count()
            committee_completed = committee_tasks.filter(status='COMPLETED').count()
            progress_value = round((committee_completed / committee_total) * 100, 1) if committee_total else 0
            subcommittee_progress.append({
                'label': committee.name,
                'value': progress_value,
            })

        kpis = {
            'tasks_completed': {
                'label': 'Tasks Completed',
                'value': completed_tasks,
                'total': total_tasks,
                'percentage': round(completed_tasks / total_tasks * 100, 1) if total_tasks else 0,
                'trend': 'up',
                'color': 'success',
                'icon': 'CheckCircle',
            },
            'funds_collected': {
                'label': 'Funds Collected',
                'value': float(total_collected),
                'total': float(total_target),
                'percentage': round(float(total_collected) / float(total_target) * 100, 1) if total_target else 0,
                'trend': 'up',
                'color': 'primary',
                'icon': 'AttachMoney',
                'format': 'currency',
            },
            'funds_spent': {
                'label': 'Funds Spent',
                'value': float(total_spent),
                'total': float(event.total_budget or 0),
                'percentage': round(float(total_spent) / float(event.total_budget) * 100, 1) if event.total_budget else 0,
                'trend': 'neutral',
                'color': 'warning',
                'icon': 'TrendingUp',
                'format': 'currency',
            },
            'members': {
                'label': 'Active Members',
                'value': total_members,
                'total': total_members,
                'percentage': 100,
                'trend': 'neutral',
                'color': 'info',
                'icon': 'People',
            },
            'event_progress': {
                'label': 'Overall Progress',
                'value': float(event.overall_progress),
                'total': 100,
                'percentage': float(event.overall_progress),
                'trend': 'up',
                'color': 'warning',
                'icon': 'TrendingUp',
            },
            'mobilization_progress': {
                'label': 'Mobilization Progress',
                'value': round(float(mobilisation_collected) / float(mobilisation_target) * 100, 1) if mobilisation_target else 0,
                'total': 100,
                'percentage': round(float(mobilisation_collected) / float(mobilisation_target) * 100, 1) if mobilisation_target else 0,
                'trend': 'up',
                'color': 'info',
                'icon': 'TrendingUp',
            },
        }

        overdue_list = []
        for t in overdue_tasks[:10]:
            overdue_list.append({
                'id': t.id,
                'title': t.title,
                'subcommittee_name': t.committee.name if t.committee else '',
                'status': t.status,
                'priority': t.priority,
                'assigned_to': t.assigned_to.get_full_name() if t.assigned_to else '',
                'deadline': t.deadline.isoformat() if t.deadline else None,
                'days_remaining': (t.deadline - timezone.now()).days if t.deadline else None,
            })

        task_status_chart = [
            {'label': 'Completed', 'value': completed_tasks, 'color': '#4caf50'},
            {'label': 'In Progress', 'value': in_progress,  'color': '#2196f3'},
            {'label': 'Pending',     'value': pending_tasks, 'color': '#ff9800'},
        ]

        return Response({
            'event_name': event.name,
            'kpis': kpis,
            'overdue_tasks': overdue_list,
            'daily_collections': daily_collections,
            'latest_contributions': latest_contributions,
            'largest_expenses': largest_expenses,
            'pending_approvals': pending_approvals,
            'subcommittee_progress': subcommittee_progress,
            'task_status_chart': task_status_chart,
            'event_details': {
                'name': event.name,
                'status': event.status,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'days_until_event': event.days_until_event,
            },
        })

    @action(detail=True, methods=['get'], url_path='reports/operations')
    def reports_operations(self, request, pk=None):
        """Operations / tasks breakdown report"""
        from apps.tasks.models import Task
        from apps.committees.models import Committee

        event = self.get_object()
        start, end = self._parse_date_filters(request)

        tasks_qs = Task.objects.filter(event=event)
        if start:
            tasks_qs = tasks_qs.filter(created_at__date__gte=start)
        if end:
            tasks_qs = tasks_qs.filter(created_at__date__lte=end)

        committees = Committee.objects.filter(event_id=event.id)
        subcommittee_data = []
        for c in committees:
            c_tasks = tasks_qs.filter(committee=c)
            total = c_tasks.count()
            done  = c_tasks.filter(status='COMPLETED').count()
            subcommittee_data.append({
                'id': str(c.id),
                'name': c.name,
                'committee_type': c.committee_type,
                'total_tasks': total,
                'completed_tasks': done,
                'pending_tasks': c_tasks.filter(status='PENDING').count(),
                'in_progress_tasks': c_tasks.filter(status='IN_PROGRESS').count(),
                'blocked_count': c_tasks.filter(status='CANCELLED').count(),
                'completion_rate': round(done / total * 100, 1) if total else 0,
                'overdue_count': c_tasks.filter(
                    status__in=['PENDING', 'IN_PROGRESS'],
                    deadline__lt=timezone.now()
                ).count(),
            })

        recent_tasks = []
        for t in tasks_qs.order_by('-updated_at')[:20]:
            recent_tasks.append({
                'id': t.id,
                'title': t.title,
                'subcommittee_name': t.committee.name if t.committee else '',
                'status': t.status,
                'priority': t.priority,
                'assigned_to': t.assigned_to.get_full_name() if t.assigned_to else '',
                'deadline': t.deadline.isoformat() if t.deadline else None,
                'days_remaining': (t.deadline - timezone.now()).days if t.deadline else None,
                'completion_percentage': float(t.progress_percentage or 0),
            })

        priority_chart = []
        for priority in ['LOW', 'MEDIUM', 'HIGH', 'URGENT']:
            count = tasks_qs.filter(priority=priority).count()
            priority_chart.append({'label': priority.title(), 'value': count})

        return Response({
            'event_name': event.name,
            'subcommittee_performance': subcommittee_data,
            'recent_tasks': recent_tasks,
            'priority_breakdown': priority_chart,
            'totals': {
                'total_tasks': tasks_qs.count(),
                'completed': tasks_qs.filter(status='COMPLETED').count(),
                'in_progress': tasks_qs.filter(status='IN_PROGRESS').count(),
                'pending': tasks_qs.filter(status='PENDING').count(),
                'cancelled': tasks_qs.filter(status='CANCELLED').count(),
                'overdue': tasks_qs.filter(
                    status__in=['PENDING', 'IN_PROGRESS'],
                    deadline__lt=timezone.now()
                ).count(),
            },
        })

    @action(detail=True, methods=['get'], url_path='reports/finance')
    def reports_finance(self, request, pk=None):
        """Finance / income & expenditure report"""
        from apps.finance.models import Collection, Expense

        event = self.get_object()
        start, end = self._parse_date_filters(request)

        collections_qs = Collection.objects.filter(event=event)
        expenses_qs    = Expense.objects.filter(event=event)
        if start:
            collections_qs = collections_qs.filter(created_at__date__gte=start)
            expenses_qs    = expenses_qs.filter(created_at__date__gte=start)
        if end:
            collections_qs = collections_qs.filter(created_at__date__lte=end)
            expenses_qs    = expenses_qs.filter(created_at__date__lte=end)

        total_income  = collections_qs.aggregate(t=Sum('amount'))['t'] or 0
        total_expense = expenses_qs.filter(status='PAID').aggregate(t=Sum('amount'))['t'] or 0
        pending_budget_items_count = expenses_qs.filter(
            status__in=['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER']
        ).count()

        income_ledger = []
        for c in collections_qs.order_by('-created_at')[:50]:
            income_ledger.append({
                'id': c.id,
                'date': c.created_at.isoformat(),
                'payer_name': c.payer_name,
                'payer_phone': c.payer_phone,
                'amount': str(c.amount),
                'channel': c.channel,
                'source_type': c.source_type,
                'reference': c.reference_number,
                'description': c.description,
            })

        expense_ledger = []
        for e in expenses_qs.order_by('-created_at')[:50]:
            expense_ledger.append({
                'id': e.id,
                'date': e.created_at.isoformat(),
                'description': e.description or '',
                'category': getattr(e, 'category', ''),
                'amount': str(e.amount),
                'status': e.status,
                'vendor': getattr(e, 'vendor', ''),
            })

        channel_breakdown = []
        for channel in ['CASH', 'MPESA', 'BANK', 'OTHER']:
            total = collections_qs.filter(channel=channel).aggregate(t=Sum('amount'))['t'] or 0
            if total:
                channel_breakdown.append({'label': channel, 'value': float(total)})

        return Response({
            'event_name': event.name,
            'summary': {
                'total_income': float(total_income),
                'total_expense': float(total_expense),
                'balance': float(total_income) - float(total_expense),
                'total_budget': float(event.total_budget),
                'budget_utilization': round(float(total_expense) / float(event.total_budget) * 100, 1) if event.total_budget else 0,
                'pending_budget_items_count': pending_budget_items_count,
            },
            'income_ledger': income_ledger,
            'expense_ledger': expense_ledger,
            'channel_breakdown': channel_breakdown,
        })

    @action(detail=True, methods=['get'], url_path='reports/clusters')
    def reports_clusters(self, request, pk=None):
        """Cluster fundraising report"""
        event = self.get_object()
        start, end = self._parse_date_filters(request)

        clusters = ClusterGroup.objects.filter(event=event).select_related('cluster_lead')

        cluster_rows = []
        for c in clusters:
            contributions_qs = c.contributions.filter(is_pledge=False)
            if start:
                contributions_qs = contributions_qs.filter(created_at__date__gte=start)
            if end:
                contributions_qs = contributions_qs.filter(created_at__date__lte=end)

            deposits_qs = c.deposits.all()
            pending_deposits  = deposits_qs.filter(confirmed_by_treasurer=False).count()
            confirmed_deposits = deposits_qs.filter(confirmed_by_treasurer=True).count()

            cluster_rows.append({
                'id': c.id,
                'name': c.name,
                'cluster_lead': c.cluster_lead.full_name if c.cluster_lead else 'Unassigned',
                'lead_name': c.cluster_lead.full_name if c.cluster_lead else 'Unassigned',
                'target_amount': float(c.target_amount),
                'collected_amount': float(c.collected_amount),
                'pledged_amount': float(c.pledged_amount),
                'submitted_to_treasurer': float(c.submitted_to_treasurer),
                'funds_in_lead_account': float(c.funds_in_lead_account),
                'balance': float(c.balance),
                'progress_percentage': float(c.progress_percentage),
                'pending_deposits': pending_deposits,
                'confirmed_deposits': confirmed_deposits,
                'total_contributors': contributions_qs.values('contributor_name').distinct().count(),
            })

        collection_ledger = []
        for c in ClusterContribution.objects.filter(
            cluster__event=event, is_pledge=False
        ).select_related('cluster', 'recorded_by').order_by('-created_at')[:50]:
            collection_ledger.append({
                'id': c.id,
                'cluster_name': c.cluster.name,
                'contributor_name': c.contributor_name,
                'contributor_phone': c.contributor_phone,
                'amount': str(c.amount),
                'payment_channel': c.payment_channel,
                'reference_number': c.reference_number,
                'date': c.created_at.isoformat(),
            })

        total_target    = sum(r['target_amount']    for r in cluster_rows)
        total_collected = sum(r['collected_amount'] for r in cluster_rows)

        return Response({
            'event_name': event.name,
            'clusters': cluster_rows,
            'collection_ledger': collection_ledger,
            'totals': {
                'total_target':    total_target,
                'total_collected': total_collected,
                'overall_progress': round(total_collected / total_target * 100, 1) if total_target else 0,
                'pending_deposits': sum(r['pending_deposits']   for r in cluster_rows),
                'confirmed_deposits': sum(r['confirmed_deposits'] for r in cluster_rows),
            },
        })

    @action(detail=True, methods=['get'], url_path='reports/members')
    def reports_members(self, request, pk=None):
        """Member activity report"""
        from apps.tasks.models import Task

        event = self.get_object()
        start, end = self._parse_date_filters(request)

        members = event.members.filter(is_active=True).select_related('user')

        member_rows = []
        for m in members:
            tasks_qs = Task.objects.filter(event=event, assigned_to=m.user)
            if start:
                tasks_qs = tasks_qs.filter(created_at__date__gte=start)
            if end:
                tasks_qs = tasks_qs.filter(created_at__date__lte=end)

            total     = tasks_qs.count()
            completed = tasks_qs.filter(status='COMPLETED').count()
            overdue   = tasks_qs.filter(
                status__in=['PENDING', 'IN_PROGRESS'],
                deadline__lt=timezone.now()
            ).count()

            member_rows.append({
                'id': m.id,
                'full_name': m.full_name,
                'phone': m.phone,
                'role': m.role,
                'role_display': m.get_role_display(),
                'tasks_assigned': total,
                'tasks_completed': completed,
                'tasks_overdue': overdue,
                'completion_rate': round(completed / total * 100, 1) if total else 0,
                'subcommittees_assigned': list(
                    m.user.committee_memberships.filter(committee__event=event).values_list('committee__name', flat=True).distinct()
                ),
                'cluster_role': 'LEAD' if ClusterGroup.objects.filter(event=event, cluster_lead=m.user).exists() else 'NONE',
                'joined_at': m.joined_at.isoformat(),
                'is_official': m.is_official,
            })

        role_distribution = []
        for role, label in EventMember.ROLE_CHOICES:
            count = event.members.filter(role=role, is_active=True).count()
            if count:
                role_distribution.append({'label': label, 'value': count})

        return Response({
            'event_name': event.name,
            'members': member_rows,
            'role_distribution': role_distribution,
            'totals': {
                'total_members': len(member_rows),
                'officials': sum(1 for m in member_rows if m['is_official']),
                'with_tasks': sum(1 for m in member_rows if m['tasks_assigned'] > 0),
            },
        })


class EventMemberViewSet(viewsets.ModelViewSet):
    """ViewSet for EventMember CRUD operations"""
    
    queryset = EventMember.objects.all()
    serializer_class = EventMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter members based on event access"""
        user = self.request.user
        queryset = EventMember.objects.all()
        
        # Filter by event if provided
        event_id = self.request.query_params.get('event', None)
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by role if provided
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Non-superusers can only see members of events they belong to
        if not (user.is_superuser or user.is_staff):
            queryset = queryset.filter(
                event__members__user=user,
                event__members__is_active=True
            )
        
        return queryset.select_related('event', 'user').distinct()

    def create(self, request, *args, **kwargs):
        event_id = request.data.get('event')
        if not _has_any_role(request.user, event_id, {'executive_admin', 'chair', 'secretary', 'treasurer'}):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        member = self.get_object()
        if not _has_any_role(request.user, member.event_id, {'executive_admin', 'chair', 'secretary', 'treasurer'}):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        member = self.get_object()
        if not _has_any_role(request.user, member.event_id, {'executive_admin', 'chair', 'secretary', 'treasurer'}):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def officials(self, request):
        """Get all officials (Chairman, Secretary, Treasurer, Event Owners)"""
        event_id = request.query_params.get('event')
        if not event_id:
            return Response(
                {'error': 'Event ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        officials = self.get_queryset().filter(
            event_id=event_id,
            role__in=['CHAIRMAN', 'SECRETARY', 'TREASURER', 'EVENT_OWNER'],
            is_active=True
        )
        serializer = self.get_serializer(officials, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_role(self, request):
        """Get members grouped by role"""
        event_id = request.query_params.get('event')
        if not event_id:
            return Response(
                {'error': 'Event ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        members = self.get_queryset().filter(event_id=event_id, is_active=True)
        
        grouped = {
            'CHAIRMAN': [],
            'SECRETARY': [],
            'TREASURER': [],
            'EVENT_OWNER': [],
            'MEMBER': []
        }
        
        for member in members:
            serialized = self.get_serializer(member).data
            grouped[member.role].append(serialized)
        
        return Response(grouped)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a member"""
        member = self.get_object()
        member.is_active = False
        member.save()
        
        serializer = self.get_serializer(member)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Reactivate a member"""
        member = self.get_object()
        member.is_active = True
        member.save()
        
        serializer = self.get_serializer(member)
        return Response(serializer.data)


class ClusterGroupViewSet(viewsets.ModelViewSet):
    """ViewSet for ClusterGroup CRUD operations and statistics"""
    queryset = ClusterGroup.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ClusterGroupListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ClusterGroupCreateSerializer
        else:
            return ClusterGroupDetailSerializer
    
    def get_queryset(self):
        """Filter clusters by event"""
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset.select_related('event', 'cluster_lead', 'funds_mobilization_committee')

    def perform_create(self, serializer):
        """Auto-assign/create the Funds Mobilization Committee for the event."""
        from apps.committees.models import Committee

        event = serializer.validated_data.get('event')
        event_id = event.id
        committee = Committee.objects.filter(
            event_id=event_id,
            committee_type='FUNDS_MOBILIZATION'
        ).first()

        if not committee:
            # Keep cluster creation robust by auto-provisioning the required committee.
            committee = Committee.objects.create(
                event=event,
                name='Funds Mobilization Committee',
                committee_type='FUNDS_MOBILIZATION',
                description='Auto-created by cluster creation flow.',
                created_by=self.request.user if self.request.user.is_authenticated else None,
                lead=self.request.user if self.request.user.is_authenticated else None,
            )

        serializer.save(funds_mobilization_committee=committee)
    
    @action(detail=True, methods=['post'])
    def update_amounts(self, request, pk=None):
        """Recalculate all amounts from contributions and deposits"""
        cluster = self.get_object()
        
        # Recalculate collected amount from contributions
        cluster.update_collected_amount()
        
        # Recalculate pledged amount from pledges
        cluster.update_pledged_amount()
        
        # Recalculate submitted amount from confirmed deposits
        cluster.update_submitted_amount()
        
        serializer = self.get_serializer(cluster)
        return Response({
            'status': 'Amounts updated successfully',
            'cluster': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get cluster summary with detailed statistics"""
        cluster = self.get_object()
        
        # Get contribution statistics
        contributions = cluster.contributions.all()
        total_contributions = contributions.filter(is_pledge=False).count()
        total_pledges = contributions.filter(is_pledge=True, pledge_fulfilled=False).count()
        fulfilled_pledges = contributions.filter(is_pledge=True, pledge_fulfilled=True).count()
        
        # Get deposit statistics
        deposits = cluster.deposits.all()
        pending_deposits = deposits.filter(confirmed_by_treasurer=False).count()
        confirmed_deposits = deposits.filter(confirmed_by_treasurer=True).count()
        
        # Calculate totals
        total_deposited = deposits.filter(confirmed_by_treasurer=True).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'cluster_name': cluster.name,
            'cluster_lead': cluster.cluster_lead.full_name if cluster.cluster_lead else None,
            'financial_summary': {
                'target_amount': cluster.target_amount,
                'collected_amount': cluster.collected_amount,
                'pledged_amount': cluster.pledged_amount,
                'balance': cluster.balance,
                'progress_percentage': float(cluster.progress_percentage),
            },
            'fund_management': {
                'funds_in_lead_account': cluster.funds_in_lead_account,
                'pending_in_lead_account': float(cluster.pending_in_lead_account),
                'submitted_to_treasurer': cluster.submitted_to_treasurer,
            },
            'contribution_statistics': {
                'total_contributions': total_contributions,
                'total_pledges': total_pledges,
                'fulfilled_pledges': fulfilled_pledges,
            },
            'deposit_statistics': {
                'pending_deposits': pending_deposits,
                'confirmed_deposits': confirmed_deposits,
                'total_deposited': total_deposited,
            }
        })
    
    @action(detail=False, methods=['get'])
    def by_event(self, request):
        """Group clusters by event"""
        event_id = request.query_params.get('event')
        
        if not event_id:
            return Response({'error': 'Event ID is required'}, status=400)
        
        clusters = self.get_queryset().filter(event_id=event_id)
        serializer = ClusterGroupListSerializer(clusters, many=True)
        
        return Response({
            'event_id': event_id,
            'total_clusters': clusters.count(),
            'clusters': serializer.data
        })


class ClusterContributionViewSet(viewsets.ModelViewSet):
    """ViewSet for ClusterContribution CRUD operations"""
    queryset = ClusterContribution.objects.all()
    serializer_class = ClusterContributionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        cluster_id = request.data.get('cluster')
        try:
            cluster = ClusterGroup.objects.get(id=cluster_id)
        except ClusterGroup.DoesNotExist:
            return Response({'error': 'Cluster not found'}, status=status.HTTP_404_NOT_FOUND)

        if not _can_manage_cluster_transactions(request.user, cluster):
            return Response(
                {'detail': 'Only cluster lead of this cluster or event officials can add transactions'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        contribution = serializer.save(recorded_by=self.request.user)

        # Keep aggregates in sync for cluster dashboards and reports.
        cluster = contribution.cluster
        cluster.update_collected_amount()
        cluster.update_pledged_amount()
    
    def get_queryset(self):
        """Filter contributions by cluster or pledge status"""
        queryset = super().get_queryset()
        cluster_id = self.request.query_params.get('cluster')
        is_pledge = self.request.query_params.get('is_pledge')
        
        if cluster_id:
            queryset = queryset.filter(cluster_id=cluster_id)
        
        if is_pledge is not None:
            if is_pledge.lower() == 'true':
                queryset = queryset.filter(is_pledge=True)
            else:
                queryset = queryset.filter(is_pledge=False)
        
        return queryset.select_related('cluster', 'recorded_by')
    
    @action(detail=True, methods=['post'])
    def fulfill_pledge(self, request, pk=None):
        """Convert a pledge to an actual payment"""
        contribution = self.get_object()
        
        if not contribution.is_pledge:
            return Response({
                'error': 'This contribution is not a pledge'
            }, status=400)
        
        if contribution.pledge_fulfilled:
            return Response({
                'error': 'This pledge has already been fulfilled'
            }, status=400)
        
        # Get payment details from request
        payment_channel = request.data.get('payment_channel')
        reference_number = request.data.get('reference_number', '')
        
        if not payment_channel:
            return Response({
                'error': 'Payment channel is required'
            }, status=400)
        
        # Fulfill the pledge
        if contribution.fulfill_pledge(payment_channel, reference_number):
            serializer = self.get_serializer(contribution)
            return Response({
                'status': 'Pledge fulfilled successfully',
                'contribution': serializer.data
            })
        
        return Response({
            'error': 'Failed to fulfill pledge'
        }, status=400)
    
    @action(detail=False, methods=['get'])
    def by_cluster(self, request):
        """Get all contributions grouped by cluster"""
        cluster_id = request.query_params.get('cluster')
        
        if not cluster_id:
            return Response({'error': 'Cluster ID is required'}, status=400)
        
        contributions = self.get_queryset().filter(cluster_id=cluster_id)
        
        # Separate pledges and payments
        payments = contributions.filter(is_pledge=False)
        pledges = contributions.filter(is_pledge=True)
        
        return Response({
            'cluster_id': cluster_id,
            'payments': {
                'count': payments.count(),
                'total': payments.aggregate(total=Sum('amount'))['total'] or 0,
                'items': ClusterContributionSerializer(payments, many=True).data
            },
            'pledges': {
                'count': pledges.count(),
                'total': pledges.aggregate(total=Sum('amount'))['total'] or 0,
                'fulfilled': pledges.filter(pledge_fulfilled=True).count(),
                'pending': pledges.filter(pledge_fulfilled=False).count(),
                'items': ClusterContributionSerializer(pledges, many=True).data
            }
        })


class ClusterDepositViewSet(viewsets.ModelViewSet):
    """ViewSet for ClusterDeposit CRUD operations"""
    queryset = ClusterDeposit.objects.all()
    serializer_class = ClusterDepositSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        cluster_id = request.data.get('cluster')
        try:
            cluster = ClusterGroup.objects.get(id=cluster_id)
        except ClusterGroup.DoesNotExist:
            return Response({'error': 'Cluster not found'}, status=status.HTTP_404_NOT_FOUND)

        if not _can_manage_cluster_transactions(request.user, cluster):
            return Response(
                {'detail': 'Only cluster lead of this cluster or event officials can submit transactions'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(deposited_by=self.request.user)
    
    def get_queryset(self):
        """Filter deposits by event, cluster, or confirmation status"""
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        cluster_id = self.request.query_params.get('cluster')
        confirmed = self.request.query_params.get('confirmed')

        if event_id:
            queryset = queryset.filter(cluster__event_id=event_id)

        if cluster_id:
            queryset = queryset.filter(cluster_id=cluster_id)
        
        if confirmed is not None:
            if confirmed.lower() == 'true':
                queryset = queryset.filter(confirmed_by_treasurer=True)
            else:
                queryset = queryset.filter(confirmed_by_treasurer=False)
        
        return queryset.select_related('cluster', 'deposited_by', 'confirmed_by')
    
    @action(detail=True, methods=['post'])
    def confirm_by_treasurer(self, request, pk=None):
        """Treasurer confirms receipt of deposit"""
        deposit = self.get_object()
        treasurer = request.user

        if not _has_any_role(treasurer, deposit.cluster.event_id, {'treasurer', 'executive_admin'}):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if deposit.confirmed_by_treasurer:
            return Response({
                'error': 'This deposit has already been confirmed',
                'confirmed_by': deposit.confirmed_by.get_full_name() if deposit.confirmed_by else None,
                'confirmation_date': deposit.treasurer_confirmation_date
            }, status=400)
        
        # Confirm the deposit
        if deposit.confirm_by_treasurer(treasurer):
            serializer = self.get_serializer(deposit)
            return Response({
                'status': 'Deposit confirmed successfully',
                'deposit': serializer.data,
                'event_total_collected_updated': True
            })
        
        return Response({
            'error': 'Failed to confirm deposit'
        }, status=400)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all unconfirmed deposits"""
        cluster_id = request.query_params.get('cluster')
        
        pending_deposits = self.get_queryset().filter(confirmed_by_treasurer=False)
        
        if cluster_id:
            pending_deposits = pending_deposits.filter(cluster_id=cluster_id)
        
        serializer = self.get_serializer(pending_deposits, many=True)
        
        total_pending = pending_deposits.aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'count': pending_deposits.count(),
            'total_amount': total_pending,
            'deposits': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def by_cluster(self, request):
        """Get all deposits for a specific cluster"""
        cluster_id = request.query_params.get('cluster')
        
        if not cluster_id:
            return Response({'error': 'Cluster ID is required'}, status=400)
        
        deposits = self.get_queryset().filter(cluster_id=cluster_id)
        
        confirmed = deposits.filter(confirmed_by_treasurer=True)
        pending = deposits.filter(confirmed_by_treasurer=False)
        
        return Response({
            'cluster_id': cluster_id,
            'confirmed': {
                'count': confirmed.count(),
                'total': confirmed.aggregate(total=Sum('amount'))['total'] or 0,
                'items': ClusterDepositSerializer(confirmed, many=True).data
            },
            'pending': {
                'count': pending.count(),
                'total': pending.aggregate(total=Sum('amount'))['total'] or 0,
                'items': ClusterDepositSerializer(pending, many=True).data
            }
        })


class BudgetItemViewSet(viewsets.ModelViewSet):
    """ViewSet for BudgetItem CRUD operations"""
    queryset = BudgetItem.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return BudgetItemListSerializer
        elif self.action == 'create':
            return BudgetItemCreateSerializer
        else:
            return BudgetItemSerializer
    
    def get_queryset(self):
        """Filter budget items by event, committee, or status"""
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        committee_id = self.request.query_params.get('committee')
        status_filter = self.request.query_params.get('status')
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        
        return queryset.select_related('event', 'committee', 'created_by', 'approved_by')
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    def _get_event_role(self, user, event_id):
        membership = EventMember.objects.filter(
            event_id=event_id,
            user=user,
            is_active=True,
        ).first()
        return membership.role if membership else None

    def _can_review_budget_item(self, user, event_id):
        return _has_any_role(
            user,
            event_id,
            {'chair', 'treasurer', 'finance_member', 'executive_admin'}
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a budget item"""
        budget_item = self.get_object()

        if not self._can_review_budget_item(request.user, budget_item.event_id):
            return Response({
                'error': 'Only Chairman, Treasurer, or Finance Committee can approve budget items'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if budget_item.approve(request.user):
            serializer = self.get_serializer(budget_item)
            return Response({
                'status': 'Budget item approved successfully',
                'budget_item': serializer.data
            })
        
        return Response({
            'error': 'Budget item already approved'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a budget item"""
        budget_item = self.get_object()

        if not self._can_review_budget_item(request.user, budget_item.event_id):
            return Response({
                'error': 'Only Chairman, Treasurer, or Finance Committee can reject budget items'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if budget_item.reject(request.user):
            serializer = self.get_serializer(budget_item)
            return Response({
                'status': 'Budget item rejected',
                'budget_item': serializer.data
            })
        
        return Response({
            'error': 'Can only reject pending budget items'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark budget item as completed"""
        budget_item = self.get_object()
        
        if budget_item.mark_completed():
            serializer = self.get_serializer(budget_item)
            return Response({
                'status': 'Budget item marked as completed',
                'budget_item': serializer.data
            })
        
        return Response({
            'error': 'Can only mark approved items as completed'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def update_spent_amount(self, request, pk=None):
        """Recalculate spent amount from expenses"""
        budget_item = self.get_object()
        budget_item.update_spent_amount()
        
        serializer = self.get_serializer(budget_item)
        return Response({
            'status': 'Spent amount updated successfully',
            'budget_item': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get budget summary for an event"""
        event_id = request.query_params.get('event')
        
        if not event_id:
            return Response({'error': 'Event ID is required'}, status=400)
        
        event_items = self.get_queryset().filter(event_id=event_id)
        active_items = event_items.exclude(status='REJECTED')

        total_estimated = active_items.aggregate(
            total=Sum('allocated_amount')
        )['total'] or 0

        approved_budget = active_items.filter(status__in=['APPROVED', 'COMPLETED']).aggregate(
            total=Sum('allocated_amount')
        )['total'] or 0

        pending_budget = active_items.filter(status='PENDING').aggregate(
            total=Sum('allocated_amount')
        )['total'] or 0

        from apps.finance.models import Expense
        used_budget = Expense.objects.filter(
            event_id=event_id,
            budget_item__isnull=False,
            status='PAID'
        ).aggregate(total=Sum('amount'))['total'] or 0

        remaining = total_estimated - used_budget
        utilization = (used_budget / total_estimated * 100) if total_estimated > 0 else 0
        
        # Group by category
        by_category = {}
        for item in active_items:
            category = item.category
            if category not in by_category:
                by_category[category] = {
                    'allocated': 0,
                    'spent': 0,
                    'items': []
                }
            by_category[category]['allocated'] += float(item.allocated_amount)
            by_category[category]['spent'] += float(item.spent_amount)
            by_category[category]['items'].append(BudgetItemListSerializer(item).data)
        
        return Response({
            'event_id': event_id,
            'summary': {
                'total_estimated_budget': total_estimated,
                'approved_budget': approved_budget,
                'pending_budget': pending_budget,
                'used_budget': used_budget,
                'remaining': remaining,
                'utilization_percentage': round(utilization, 2)
            },
            'by_category': by_category
        })


class BudgetAdjustmentRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for BudgetAdjustmentRequest CRUD operations"""
    queryset = BudgetAdjustmentRequest.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return BudgetAdjustmentRequestCreateSerializer
        else:
            return BudgetAdjustmentRequestSerializer
    
    def get_queryset(self):
        """Filter adjustment requests by budget item or status"""
        queryset = super().get_queryset()
        budget_item_id = self.request.query_params.get('budget_item')
        status_filter = self.request.query_params.get('status')
        
        if budget_item_id:
            queryset = queryset.filter(budget_item_id=budget_item_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        
        return queryset.select_related('budget_item', 'requested_by', 'reviewed_by')
    
    def perform_create(self, serializer):
        """Set requested_by to current user"""
        serializer.save(requested_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve adjustment request and update budget item"""
        adjustment_request = self.get_object()
        if not _has_any_role(
            request.user,
            adjustment_request.budget_item.event_id,
            {'chair', 'treasurer', 'finance_member', 'executive_admin'}
        ):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if adjustment_request.approve(request.user):
            serializer = self.get_serializer(adjustment_request)
            return Response({
                'status': 'Adjustment request approved and budget updated',
                'adjustment_request': serializer.data,
                'new_allocated_amount': adjustment_request.budget_item.allocated_amount
            })
        
        return Response({
            'error': 'Can only approve pending requests'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject adjustment request"""
        adjustment_request = self.get_object()
        review_notes = request.data.get('review_notes', '')
        if not _has_any_role(
            request.user,
            adjustment_request.budget_item.event_id,
            {'chair', 'treasurer', 'finance_member', 'executive_admin'}
        ):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if adjustment_request.reject(request.user, review_notes):
            serializer = self.get_serializer(adjustment_request)
            return Response({
                'status': 'Adjustment request rejected',
                'adjustment_request': serializer.data
            })
        
        return Response({
            'error': 'Can only reject pending requests'
        }, status=400)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending adjustment requests"""
        budget_item_id = request.query_params.get('budget_item')
        
        pending_requests = self.get_queryset().filter(status='PENDING')
        
        if budget_item_id:
            pending_requests = pending_requests.filter(budget_item_id=budget_item_id)
        
        serializer = self.get_serializer(pending_requests, many=True)
        
        total_increase = pending_requests.filter(
            adjustment_amount__gt=0
        ).aggregate(total=Sum('adjustment_amount'))['total'] or 0
        
        total_decrease = pending_requests.filter(
            adjustment_amount__lt=0
        ).aggregate(total=Sum('adjustment_amount'))['total'] or 0
        
        return Response({
            'count': pending_requests.count(),
            'total_increase_requested': total_increase,
            'total_decrease_requested': abs(total_decrease),
            'requests': serializer.data
        })


class EventScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for EventSchedule CRUD operations"""
    queryset = EventSchedule.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EventScheduleListSerializer
        elif self.action == 'create':
            return EventScheduleCreateSerializer
        return EventScheduleSerializer
    
    def get_queryset(self):
        """Filter schedules by event, type, or status"""
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        schedule_type = self.request.query_params.get('type')
        status_filter = self.request.query_params.get('status')
        is_public = self.request.query_params.get('public')
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if schedule_type:
            queryset = queryset.filter(schedule_type=schedule_type)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by user when creating schedule"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a schedule to make it public"""
        schedule = self.get_object()
        
        if schedule.publish():
            serializer = self.get_serializer(schedule)
            return Response({
                'status': 'Schedule published successfully',
                'schedule': serializer.data
            })
        
        return Response({
            'error': 'Unable to publish schedule'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a schedule"""
        schedule = self.get_object()
        
        if schedule.cancel():
            serializer = self.get_serializer(schedule)
            return Response({
                'status': 'Schedule cancelled successfully',
                'schedule': serializer.data
            })
        
        return Response({
            'error': 'Unable to cancel schedule'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark schedule as completed"""
        schedule = self.get_object()
        
        if schedule.mark_completed():
            serializer = self.get_serializer(schedule)
            return Response({
                'status': 'Schedule marked as completed',
                'schedule': serializer.data
            })
        
        return Response({
            'error': 'Unable to mark schedule as completed'
        }, status=400)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming schedules ordered by start time"""
        from django.utils import timezone
        
        event_id = request.query_params.get('event')
        limit = int(request.query_params.get('limit', 10))
        
        queryset = self.get_queryset().filter(
            start_datetime__gte=timezone.now(),
            status__in=['PUBLISHED', 'DRAFT']
        ).order_by('start_datetime')[:limit]
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        serializer = EventScheduleListSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'upcoming_schedules': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def public_program(self, request):
        """Get public program/schedule for an event"""
        event_id = request.query_params.get('event')
        
        if not event_id:
            return Response({'error': 'Event ID required'}, status=400)
        
        queryset = self.get_queryset().filter(
            event_id=event_id,
            is_public=True,
            status='PUBLISHED'
        ).order_by('start_datetime')
        
        serializer = EventScheduleListSerializer(queryset, many=True)
        return Response({
            'event_id': event_id,
            'program_count': queryset.count(),
            'program': serializer.data
        })


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only ViewSet for AuditLog"""
    queryset = AuditLog.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return AuditLogListSerializer
        return AuditLogSerializer
    
    def get_queryset(self):
        """Filter audit logs by event, user, model, or action"""
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        user_id = self.request.query_params.get('user')
        model_name = self.request.query_params.get('model')
        action = self.request.query_params.get('action')
        object_id = self.request.query_params.get('object_id')
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        
        if action:
            queryset = queryset.filter(action=action)
        
        if object_id:
            queryset = queryset.filter(object_id=object_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent audit logs"""
        event_id = request.query_params.get('event')
        limit = int(request.query_params.get('limit', 20))
        
        queryset = self.get_queryset().order_by('-timestamp')[:limit]
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        serializer = AuditLogListSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'recent_logs': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def by_model(self, request):
        """Get audit logs grouped by model"""
        event_id = request.query_params.get('event')
        model_name = request.query_params.get('model', '')
        
        if not event_id:
            return Response({'error': 'Event ID required'}, status=400)
        
        queryset = self.get_queryset().filter(event_id=event_id)
        
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'event_id': event_id,
            'model_name': model_name or 'All',
            'count': queryset.count(),
            'logs': serializer.data
        })


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Notification CRUD operations"""
    queryset = Notification.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return NotificationListSerializer
        elif self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        """Filter notifications by recipient, event, type, or status"""
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        recipient_id = self.request.query_params.get('recipient')
        notification_type = self.request.query_params.get('type')
        status_filter = self.request.query_params.get('status')
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if recipient_id:
            queryset = queryset.filter(recipient_id=recipient_id)
        
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        """Mark notification as sent"""
        notification = self.get_object()
        
        if notification.mark_sent():
            serializer = self.get_serializer(notification)
            return Response({
                'status': 'Notification marked as sent',
                'notification': serializer.data
            })
        
        return Response({
            'error': 'Unable to mark notification as sent'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def mark_failed(self, request, pk=None):
        """Mark notification as failed"""
        notification = self.get_object()
        error_msg = request.data.get('error_message', '')
        
        if notification.mark_failed(error_msg):
            serializer = self.get_serializer(notification)
            return Response({
                'status': 'Notification marked as failed',
                'notification': serializer.data
            })
        
        return Response({
            'error': 'Unable to mark notification as failed'
        }, status=400)
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry sending a failed notification"""
        notification = self.get_object()
        
        if notification.status in ['FAILED', 'CANCELLED']:
            notification.status = 'PENDING'
            notification.error_message = ''
            notification.save(update_fields=['status', 'error_message'])
            
            serializer = self.get_serializer(notification)
            return Response({
                'status': 'Notification queued for retry',
                'notification': serializer.data
            })
        
        return Response({
            'error': 'Can only retry failed or cancelled notifications'
        }, status=400)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending notifications"""
        event_id = request.query_params.get('event')
        
        pending_notifications = self.get_queryset().filter(status='PENDING')
        
        if event_id:
            pending_notifications = pending_notifications.filter(event_id=event_id)
        
        serializer = NotificationListSerializer(pending_notifications, many=True)
        return Response({
            'count': pending_notifications.count(),
            'pending_notifications': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        """Get notifications for the current user"""
        event_id = request.query_params.get('event')
        limit = int(request.query_params.get('limit', 20))
        
        queryset = self.get_queryset().filter(
            recipient=request.user
        ).order_by('-created_at')[:limit]
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        serializer = NotificationListSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'notifications': serializer.data
        })
