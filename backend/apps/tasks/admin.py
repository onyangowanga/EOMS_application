from django.contrib import admin
from .models import Task, TaskComment


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    readonly_fields = ['user', 'created_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'committee', 'assigned_to', 'status', 'priority', 
                    'deadline', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description']
    inlines = [TaskCommentInline]
    ordering = ['-created_at']


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'comment', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'user__full_name', 'comment']
    ordering = ['-created_at']
