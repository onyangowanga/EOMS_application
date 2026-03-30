# Generated manually based on Event and EventMember models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="e.g., 'John Doe Funeral'", max_length=255)),
                ('event_type', models.CharField(choices=[('FUNERAL', 'Funeral'), ('WEDDING', 'Wedding'), ('CORPORATE', 'Corporate Event'), ('OTHER', 'Other')], default='FUNERAL', max_length=20)),
                ('event_date', models.DateField(help_text='Main event date')),
                ('location', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('PLANNING', 'Planning'), ('ACTIVE', 'Active'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled')], default='PLANNING', max_length=20)),
                ('financial_progress', models.DecimalField(decimal_places=2, default=0.0, help_text='Financial progress percentage (0-100)', max_digits=5)),
                ('operational_progress', models.DecimalField(decimal_places=2, default=0.0, help_text='Operational progress percentage (0-100)', max_digits=5)),
                ('total_budget', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('total_collected', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('total_spent', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-event_date'],
            },
        ),
        migrations.CreateModel(
            name='EventMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('CHAIRMAN', 'Chairman'), ('SECRETARY', 'Secretary'), ('TREASURER', 'Treasurer'), ('EVENT_OWNER', 'Event Owner'), ('MEMBER', 'Committee Member')], default='MEMBER', max_length=20)),
                ('full_name', models.CharField(max_length=255)),
                ('phone', models.CharField(max_length=20)),
                ('alternative_phone', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('is_active', models.BooleanField(default=True)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='events.event')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='event_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['event', 'role'],
                'unique_together': {('event', 'user', 'role')},
            },
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['event_date', 'status'], name='events_even_event_d_idx'),
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['status'], name='events_even_status_idx'),
        ),
        migrations.AddIndex(
            model_name='eventmember',
            index=models.Index(fields=['event', 'role'], name='events_even_event_i_idx'),
        ),
        migrations.AddIndex(
            model_name='eventmember',
            index=models.Index(fields=['user'], name='events_even_user_id_idx'),
        ),
    ]
