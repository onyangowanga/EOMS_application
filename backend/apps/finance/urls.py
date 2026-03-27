from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollectionViewSet, ExpenseViewSet, FinanceViewSet

router = DefaultRouter()
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'', FinanceViewSet, basename='finance')

urlpatterns = [
    path('', include(router.urls)),
]
