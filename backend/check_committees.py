#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoms_api.settings')
django.setup()

from apps.committees.models import Committee

committees = Committee.objects.filter(event_id=11)
print(f"Committees for event 11:")
for c in committees:
    print(f"  - ID: {c.id}, Name: {c.name}, Type: {c.committee_type}, Lead: {c.lead}")

print(f"\nTotal count: {committees.count()}")

# Check committee 7 specifically
try:
    c7 = Committee.objects.get(id=7)
    print(f"\nCommittee 7 details:")
    print(f"  - Name: {c7.name}")
    print(f"  - Event ID: {c7.event_id}")
    print(f"  - Type: {c7.committee_type}")
    print(f"  - Lead: {c7.lead}")
    print(f"  - Member count: {c7.members.count()}")
except Committee.DoesNotExist:
    print("\nCommittee 7 does NOT exist")
