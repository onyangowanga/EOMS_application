from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from apps.events.models import EventMember


LEGACY_TO_RBAC = {
    'ADMIN': ['executive_admin'],
    'FINANCE': ['finance_member'],
    'LEADER': ['chair'],
    'MEMBER': ['committee_member'],
    'STAKEHOLDER': ['committee_member'],
}

EVENT_MEMBER_TO_RBAC = {
    'CHAIRMAN': ['chair'],
    'SECRETARY': ['secretary'],
    'TREASURER': ['treasurer'],
    'EVENT_OWNER': ['chair'],
    'TEAM_LEAD': ['subcommittee_lead'],
    'CLUSTER_LEAD': ['cluster_lead'],
    'MEMBER': ['committee_member'],
}

ADMIN_OVERRIDE_ROLES = {
    'executive_admin',
    'finance_member',
    'chair',
    'secretary',
    'treasurer',
    'subcommittee_lead',
    'cluster_lead',
    'committee_member',
}


def _extract_event_id(request, kwargs):
    for key in ('event_id', 'eventId', 'event'):
        if request.query_params.get(key):
            return request.query_params.get(key)
        if kwargs.get(key):
            return kwargs.get(key)
    return None


def resolve_user_roles(user, event_id=None):
    if not user or not user.is_authenticated:
        return set()

    roles = set(getattr(user, 'roles', []) or [])
    roles.update(LEGACY_TO_RBAC.get(getattr(user, 'role', None), []))

    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or 'executive_admin' in roles:
        roles.update(ADMIN_OVERRIDE_ROLES)

    if event_id:
        memberships = EventMember.objects.filter(event_id=event_id, user=user, is_active=True)
        for membership in memberships:
            roles.update(EVENT_MEMBER_TO_RBAC.get(membership.role, []))

    return roles


def require_roles(*required):
    required_set = set(required)

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(view_instance, request, *args, **kwargs):
            event_id = _extract_event_id(request, kwargs)
            user_roles = resolve_user_roles(request.user, event_id)

            if 'executive_admin' in user_roles or user_roles.intersection(required_set):
                return view_func(view_instance, request, *args, **kwargs)

            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        return wrapper

    return decorator