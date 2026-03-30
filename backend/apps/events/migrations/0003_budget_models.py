# Generated manually for Phase 3: Budget Models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_cluster_models'),
        ('committees', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BudgetItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_name', models.CharField(help_text="e.g., 'Catering Services', 'Transport Logistics'", max_length=255)),
                ('description', models.TextField(blank=True, help_text='Detailed description of the budget item')),
                ('category', models.CharField(default='OTHER', help_text='Budget category (e.g., CATERING, TRANSPORT, VENUE)', max_length=100)),
                ('allocated_amount', models.DecimalField(decimal_places=2, help_text='Approved/allocated budget amount', max_digits=12)),
                ('spent_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Amount spent so far (from linked expenses)', max_digits=12)),
                ('status', models.CharField(choices=[('PENDING', 'Pending Approval'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('COMPLETED', 'Completed')], default='PENDING', help_text='Approval status', max_length=20)),
                ('approved_at', models.DateTimeField(blank=True, help_text='When this budget item was approved', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('event', models.ForeignKey(help_text='Event this budget item belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='budget_items', to='events.event')),
                ('committee', models.ForeignKey(blank=True, help_text='Optional: Committee responsible for this budget item', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='budget_items', to='committees.committee')),
                ('created_by', models.ForeignKey(help_text='User who created this budget item', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='budget_items_created', to=settings.AUTH_USER_MODEL)),
                ('approved_by', models.ForeignKey(blank=True, help_text='User who approved this budget item', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='budget_items_approved', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BudgetAdjustmentRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('adjustment_type', models.CharField(choices=[('INCREASE', 'Increase Allocation'), ('DECREASE', 'Decrease Allocation'), ('REALLOCATION', 'Reallocation to Another Item')], default='INCREASE', max_length=20)),
                ('original_amount', models.DecimalField(decimal_places=2, help_text='Current allocated amount', max_digits=12)),
                ('requested_amount', models.DecimalField(decimal_places=2, help_text='New requested amount', max_digits=12)),
                ('adjustment_amount', models.DecimalField(decimal_places=2, help_text='Difference (positive or negative)', max_digits=12)),
                ('reason', models.TextField(help_text='Justification for the adjustment')),
                ('supporting_documents', models.FileField(blank=True, help_text='Optional supporting documents (quotes, receipts)', null=True, upload_to='budget_adjustments/')),
                ('status', models.CharField(choices=[('PENDING', 'Pending Review'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], default='PENDING', max_length=20)),
                ('review_notes', models.TextField(blank=True, help_text='Notes from reviewer (approval/rejection reason)')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('budget_item', models.ForeignKey(help_text='Budget item to be adjusted', on_delete=django.db.models.deletion.CASCADE, related_name='adjustment_requests', to='events.budgetitem')),
                ('requested_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='budget_adjustments_requested', to=settings.AUTH_USER_MODEL)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='budget_adjustments_reviewed', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='budgetitem',
            index=models.Index(fields=['event', 'status'], name='events_budg_event_i_cb8f1c_idx'),
        ),
        migrations.AddIndex(
            model_name='budgetitem',
            index=models.Index(fields=['committee'], name='events_budg_committ_7a2e5d_idx'),
        ),
        migrations.AddIndex(
            model_name='budgetitem',
            index=models.Index(fields=['created_by'], name='events_budg_created_4e1b6f_idx'),
        ),
        migrations.AddIndex(
            model_name='budgetadjustmentrequest',
            index=models.Index(fields=['budget_item', 'status'], name='events_budg_budget__8f3c2a_idx'),
        ),
        migrations.AddIndex(
            model_name='budgetadjustmentrequest',
            index=models.Index(fields=['requested_by'], name='events_budg_request_9a4d5e_idx'),
        ),
    ]
