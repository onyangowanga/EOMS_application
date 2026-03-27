from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ServiceProvider
from .serializers import ServiceProviderSerializer, ServiceProviderCreateSerializer


class ServiceProviderViewSet(viewsets.ModelViewSet):
    """ViewSet for ServiceProvider CRUD operations"""
    
    queryset = ServiceProvider.objects.all()
    serializer_class = ServiceProviderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ServiceProvider.objects.all()
        
        # Filter by committee
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        # Filter by type
        provider_type = self.request.query_params.get('type')
        if provider_type:
            queryset = queryset.filter(provider_type=provider_type)
        
        # Filter by status
        provider_status = self.request.query_params.get('status')
        if provider_status:
            queryset = queryset.filter(status=provider_status)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ServiceProviderCreateSerializer
        return ServiceProviderSerializer
    
    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update provider status"""
        provider = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(ServiceProvider.STATUS_CHOICES):
            return Response({
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        provider.status = new_status
        
        # Update actual cost if provided
        actual_cost = request.data.get('actual_cost')
        if actual_cost:
            provider.actual_cost = actual_cost
        
        provider.save()
        
        return Response(ServiceProviderSerializer(provider).data)
