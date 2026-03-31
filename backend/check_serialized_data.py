#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoms_api.settings')
django.setup()

from apps.committees.models import Committee
from apps.committees.serializers import CommitteeListSerializer

committees = Committee.objects.filter(event_id=11)
serializer = CommitteeListSerializer(committees, many=True)

print("Serialized data for committees of event 11:")
print(json.dumps(serializer.data, indent=2))
print(f"\nJSON size: {len(json.dumps(serializer.data))} bytes")
