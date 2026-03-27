from django.contrib import admin
from .models import Committee, CommitteeMember


class CommitteeMemberInline(admin.TabularInline):
    model = CommitteeMember
    extra = 1
    raw_id_fields = ['user']


@admin.register(Committee)
class CommitteeAdmin(admin.ModelAdmin):
    list_display = ['name', 'event_type', 'event_date', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'event_type', 'created_at']
    search_fields = ['name', 'description']
    inlines = [CommitteeMemberInline]
    ordering = ['-created_at']


@admin.register(CommitteeMember)
class CommitteeMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'committee', 'is_lead', 'role_description', 'joined_at']
    list_filter = ['is_lead', 'joined_at']
    search_fields = ['user__full_name', 'committee__name']
    ordering = ['-joined_at']
