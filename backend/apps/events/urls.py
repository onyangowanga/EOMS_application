from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet, 
    EventMemberViewSet,
    ClusterGroupViewSet,
    ClusterContributionViewSet,
    ClusterDepositViewSet,
    BudgetItemViewSet,
    BudgetAdjustmentRequestViewSet,
    EventScheduleViewSet,
    AuditLogViewSet,
    NotificationViewSet
)

router = DefaultRouter()
router.register(r'event-members', EventMemberViewSet, basename='eventmember')
router.register(r'clusters', ClusterGroupViewSet, basename='cluster')
router.register(r'cluster-contributions', ClusterContributionViewSet, basename='clustercontribution')
router.register(r'cluster-deposits', ClusterDepositViewSet, basename='clusterdeposit')
router.register(r'budget-items', BudgetItemViewSet, basename='budgetitem')
router.register(r'budget-adjustments', BudgetAdjustmentRequestViewSet, basename='budgetadjustment')
router.register(r'schedules', EventScheduleViewSet, basename='schedule')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'', EventViewSet, basename='event')  # Keep this last so it doesn't shadow static routes above

urlpatterns = [
    path('', include(router.urls)),
]
