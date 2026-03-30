# Generated manually for Cluster models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
        ('committees', '__first__'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ClusterGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="e.g., 'Family Members', 'Workmates', 'Church Group'", max_length=255)),
                ('target_amount', models.DecimalField(decimal_places=2, help_text='Target amount to collect from this cluster', max_digits=12)),
                ('collected_amount', models.DecimalField(decimal_places=2, default=0.0, help_text='Total amount collected so far', max_digits=12)),
                ('pledged_amount', models.DecimalField(decimal_places=2, default=0.0, help_text='Total amount pledged but not yet paid', max_digits=12)),
                ('funds_in_lead_account', models.DecimalField(decimal_places=2, default=0.0, help_text='Funds currently with the cluster leader', max_digits=12)),
                ('submitted_to_treasurer', models.DecimalField(decimal_places=2, default=0.0, help_text='Total amount deposited to treasurer', max_digits=12)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cluster_lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='led_clusters', to=settings.AUTH_USER_MODEL)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='clusters', to='events.event')),
                ('funds_mobilization_committee', models.ForeignKey(help_text='The Funds Mobilization Committee managing this cluster', on_delete=django.db.models.deletion.CASCADE, related_name='clusters', to='committees.committee')),
            ],
            options={
                'ordering': ['event', 'name'],
                'unique_together': {('event', 'name')},
            },
        ),
        migrations.CreateModel(
            name='ClusterContribution',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('contributor_name', models.CharField(max_length=255)),
                ('contributor_phone', models.CharField(blank=True, max_length=20)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('is_pledge', models.BooleanField(default=False, help_text='Is this a pledge (not yet paid)?')),
                ('pledge_fulfilled', models.BooleanField(default=False, help_text='Has this pledge been fulfilled?')),
                ('pledge_fulfillment_date', models.DateTimeField(blank=True, null=True)),
                ('payment_channel', models.CharField(choices=[('CASH', 'Cash'), ('MPESA', 'M-Pesa'), ('BANK', 'Bank Transfer'), ('CHEQUE', 'Cheque'), ('OTHER', 'Other')], default='CASH', max_length=20)),
                ('reference_number', models.CharField(blank=True, help_text='M-Pesa code, cheque number, etc.', max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cluster', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contributions', to='events.clustergroup')),
                ('recorded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cluster_contributions_recorded', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ClusterDeposit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('deposit_channel', models.CharField(choices=[('CASH', 'Cash'), ('MPESA', 'M-Pesa'), ('BANK', 'Bank Transfer'), ('CHEQUE', 'Cheque'), ('OTHER', 'Other')], default='MPESA', max_length=20)),
                ('reference_number', models.CharField(blank=True, help_text='Transaction reference number', max_length=100)),
                ('confirmed_by_treasurer', models.BooleanField(default=False, help_text='Has the treasurer confirmed receipt?')),
                ('treasurer_confirmation_date', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cluster', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deposits', to='events.clustergroup')),
                ('confirmed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cluster_deposits_confirmed', to=settings.AUTH_USER_MODEL)),
                ('deposited_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cluster_deposits_made', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='clustergroup',
            index=models.Index(fields=['event'], name='events_clus_event_i_idx'),
        ),
        migrations.AddIndex(
            model_name='clustergroup',
            index=models.Index(fields=['cluster_lead'], name='events_clus_cluster_idx'),
        ),
        migrations.AddIndex(
            model_name='clustercontribution',
            index=models.Index(fields=['cluster', '-created_at'], name='events_clus_cluster_idx2'),
        ),
        migrations.AddIndex(
            model_name='clustercontribution',
            index=models.Index(fields=['is_pledge', 'pledge_fulfilled'], name='events_clus_is_pled_idx'),
        ),
        migrations.AddIndex(
            model_name='clustercontribution',
            index=models.Index(fields=['payment_channel'], name='events_clus_payment_idx'),
        ),
        migrations.AddIndex(
            model_name='clusterdeposit',
            index=models.Index(fields=['cluster', '-created_at'], name='events_clus_cluster_idx3'),
        ),
        migrations.AddIndex(
            model_name='clusterdeposit',
            index=models.Index(fields=['confirmed_by_treasurer'], name='events_clus_confirm_idx'),
        ),
        migrations.AddIndex(
            model_name='clusterdeposit',
            index=models.Index(fields=['deposited_by'], name='events_clus_deposit_idx'),
        ),
    ]
