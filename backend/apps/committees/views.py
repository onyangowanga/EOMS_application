from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from .models import Committee, CommitteeMember
from .serializers import (
    CommitteeSerializer, CommitteeCreateSerializer,
    CommitteeMemberSerializer, AddMemberSerializer
)

User = get_user_model()


class CommitteeViewSet(viewsets.ModelViewSet):
    """ViewSet for Committee CRUD operations"""
    
    queryset = Committee.objects.all()
    serializer_class = CommitteeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CommitteeCreateSerializer
        return CommitteeSerializer
    
    def perform_create(self, serializer):
        committee = serializer.save(created_by=self.request.user)
        # Add creator as lead member
        CommitteeMember.objects.create(
            committee=committee,
            user=self.request.user,
            is_lead=True,
            role_description='Creator'
        )
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the committee"""
        committee = self.get_object()
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
