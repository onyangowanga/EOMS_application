import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  Skeleton,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AddCircle as AddIcon,
  Send as SendIcon,
  AutoFixHigh as AutoParseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { eventService } from '../services/event.service';
import type { ClusterContribution, ClusterDeposit } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatKenyaAmount, parseMpesaMessage } from '../utils/mpesa';

const PAYMENT_CHANNELS = ['CASH', 'MPESA', 'BANK', 'CHEQUE', 'OTHER'];

const ClusterDetailsPage: React.FC = () => {
  const { clusterId } = useParams<{ clusterId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [rawMpesaMessage, setRawMpesaMessage] = useState('');
  const [parseNotice, setParseNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [whatsAppNotice, setWhatsAppNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [whatsAppTopTemplate, setWhatsAppTopTemplate] = useState(
    '{{event_name_upper}}\nSupporting {{cluster_name}} and the Family\nTarget Amount: KES {{target_amount}}\nBurial Date: {{event_date}} - {{event_location}}\nKindly Send your support to this till no: {{till_number}} - {{till_account_name}}'
  );
  const [tillNumber, setTillNumber] = useState('');
  const [tillAccountName, setTillAccountName] = useState('');
  const [whatsAppBottomMessage, setWhatsAppBottomMessage] = useState(
    'On behalf of {{cluster_name}} and the family, we sincerely thank each and every one of you for your generous contributions, prayers, and support during this difficult time.\n\nMay God bless you abundantly for your compassion and generosity.'
  );

  // Ã¢â€â‚¬Ã¢â€â‚¬ Contribution dialog Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [contribOpen, setContribOpen] = useState(false);
  const [contribForm, setContribForm] = useState({
    contributor_name: '',
    contributor_phone: '',
    amount: '',
    is_pledge: false,
    payment_channel: 'CASH',
    reference_number: '',
    notes: '',
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Deposit dialog Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositForm, setDepositForm] = useState({
    amount: '',
    deposit_channel: 'MPESA',
    reference_number: '',
    notes: '',
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Queries Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const { data: cluster, isLoading: loadingCluster } = useQuery({
    queryKey: ['cluster', clusterId],
    queryFn: () => eventService.getCluster(clusterId!),
    enabled: !!clusterId,
    refetchInterval: 10000,
  });

  const { data: contributions = [], isLoading: loadingContributions } = useQuery({
    queryKey: ['cluster-contributions', clusterId],
    queryFn: () => eventService.getClusterContributions(clusterId!),
    enabled: !!clusterId,
    refetchInterval: 10000,
  });

  const { data: deposits = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ['cluster-deposits', clusterId],
    queryFn: () => eventService.getClusterDepositsByCluster(clusterId!),
    enabled: !!clusterId,
    refetchInterval: 10000,
  });

  const { data: eventMembers = [] } = useQuery({
    queryKey: ['event-members', cluster?.event],
    queryFn: () => eventService.getEventMembers(String(cluster!.event)),
    enabled: !!cluster?.event,
  });

  const { data: eventDetails } = useQuery({
    queryKey: ['event-details-for-cluster', cluster?.event],
    queryFn: () => eventService.getEvent(String(cluster!.event)),
    enabled: !!cluster?.event,
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Mutations Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const addContribMutation = useMutation({
    mutationFn: (data: Parameters<typeof eventService.createClusterContribution>[0]) =>
      eventService.createClusterContribution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-contributions', clusterId] });
      queryClient.invalidateQueries({ queryKey: ['cluster', clusterId] });
      setContribOpen(false);
      setContribForm({ contributor_name: '', contributor_phone: '', amount: '', is_pledge: false, payment_channel: 'CASH', reference_number: '', notes: '' });
      setRawMpesaMessage('');
      setParseNotice(null);
    },
  });

  const addDepositMutation = useMutation({
    mutationFn: (data: Parameters<typeof eventService.createClusterDeposit>[0]) =>
      eventService.createClusterDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-deposits', clusterId] });
      queryClient.invalidateQueries({ queryKey: ['cluster', clusterId] });
      setDepositOpen(false);
      setDepositForm({ amount: '', deposit_channel: 'MPESA', reference_number: '', notes: '' });
    },
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const allContributions = (cluster?.contributions?.length ? cluster.contributions : contributions) || [];
  const allDeposits = (cluster?.deposits?.length ? cluster.deposits : deposits) || [];

  const currentEventRole = (eventMembers as any[]).find((member: any) => member.user_details?.id === user?.id)?.role;
  const isOfficial = ['EVENT_OWNER', 'CHAIRMAN', 'SECRETARY', 'TREASURER'].includes(currentEventRole || '');
  const isLeadForThisCluster = String(cluster?.cluster_lead || '') === String(user?.id || '');
  const canManageClusterTransactions = isOfficial || isLeadForThisCluster;

  const collections = allContributions.filter((item: ClusterContribution) => !item.is_pledge);
  const pledges = allContributions.filter((item: ClusterContribution) => item.is_pledge && !item.pledge_fulfilled);

  const toNum = (value?: string | number) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value || '0'));
    return Number.isFinite(num) ? num : 0;
  };

  const targetAmount = toNum(cluster?.target_amount);
  const totalCollected = collections.reduce((sum, item) => sum + toNum(item.amount), 0);
  const totalPledged = pledges.reduce((sum, item) => sum + toNum(item.amount), 0);
  const totalConfirmedToTreasury = allDeposits
    .filter((item: ClusterDeposit) => item.confirmed_by_treasurer)
    .reduce((sum, item) => sum + toNum(item.amount), 0);
  const totalPendingToConfirm = allDeposits
    .filter((item: ClusterDeposit) => !item.confirmed_by_treasurer)
    .reduce((sum, item) => sum + toNum(item.amount), 0);
  const totalSubmittedToTreasury = totalConfirmedToTreasury + totalPendingToConfirm;
  const pendingInLeadAmount = Math.max(totalCollected - totalSubmittedToTreasury, 0);
  const balanceRemaining = targetAmount - totalCollected;
  const clusterProgress = targetAmount > 0 ? (totalCollected / targetAmount) * 100 : 0;
  const depositAmount = toNum(depositForm.amount);
  const exceedsLeadFunds = depositAmount > pendingInLeadAmount;

  const fmt = (amount?: string | number) =>
    `KES ${parseFloat(String(amount || '0')).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Submit handlers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleSaveContrib = () => {
    if (!contribForm.contributor_name || !contribForm.amount) return;
    addContribMutation.mutate({
      cluster: clusterId!,
      contributor_name: contribForm.contributor_name,
      contributor_phone: contribForm.contributor_phone || undefined,
      amount: parseFloat(contribForm.amount),
      is_pledge: contribForm.is_pledge,
      payment_channel: contribForm.is_pledge ? undefined : contribForm.payment_channel,
      reference_number: contribForm.reference_number || undefined,
      notes: contribForm.notes || undefined,
    });
  };

  const handleParseMpesaMessage = () => {
    const parsed = parseMpesaMessage(rawMpesaMessage);

    if (!parsed) {
      setParseNotice({ type: 'error', message: 'Could not parse message. Paste the full M-Pesa SMS and try again.' });
      return;
    }

    const parsedDateNote = parsed.transactionDateText
      ? `M-Pesa transaction date: ${parsed.transactionDateText}`
      : '';

    setContribForm((prev) => ({
      ...prev,
      contributor_name: parsed.contributorName || prev.contributor_name,
      contributor_phone: parsed.contributorPhone || prev.contributor_phone,
      amount: parsed.amount !== undefined ? String(parsed.amount) : prev.amount,
      payment_channel: 'MPESA',
      reference_number: parsed.transactionReference || prev.reference_number,
      notes: parsedDateNote
        ? `${prev.notes ? `${prev.notes}\n` : ''}${parsedDateNote}`.trim()
        : prev.notes,
    }));

    setParseNotice({ type: 'success', message: 'M-Pesa message parsed. Verify and save the record.' });
  };

  const buildWhatsAppUpdateText = () => {
    const eventName = eventDetails?.event_name || 'Event Fundraising Update';
    const clusterName = cluster?.name || 'Cluster';
    const eventLocation = eventDetails?.location || '[Location not set]';
    const eventDate = eventDetails?.event_date
      ? new Date(eventDetails.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '[Date not set]';

    const tokenMap: Record<string, string> = {
      event_name: eventName,
      event_name_upper: String(eventName).toUpperCase(),
      cluster_name: clusterName,
      target_amount: formatKenyaAmount(targetAmount),
      event_date: eventDate,
      event_location: eventLocation,
      till_number: tillNumber || '[ADD TILL NO]',
      till_account_name: tillAccountName || '[ACCOUNT NAME]',
    };

    const applyTemplate = (template: string) =>
      template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_match, key) => tokenMap[key] ?? '');

    const header = [applyTemplate(whatsAppTopTemplate), ''];

    const contributorLines = collections
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((item, idx) => `${idx + 1}. ${item.contributor_name} - KES ${formatKenyaAmount(parseFloat(item.amount || '0'))}`);

    const maxLines = collections.length + 10;
    while (contributorLines.length < maxLines) {
      contributorLines.push(`${contributorLines.length + 1}. `);
    }

    const footer = ['', applyTemplate(whatsAppBottomMessage)];

    return [...header, ...contributorLines, ...footer].join('\n');
  };

  const handleCopyWhatsAppUpdate = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsAppUpdateText());
      setWhatsAppNotice({ type: 'success', message: 'WhatsApp fundraising update copied to clipboard.' });
    } catch (_error) {
      setWhatsAppNotice({ type: 'error', message: 'Clipboard copy failed. Please copy manually from generated text.' });
    }
  };

  const handleSaveDeposit = () => {
    if (!depositForm.amount || depositAmount <= 0 || exceedsLeadFunds) return;
    addDepositMutation.mutate({
      cluster: clusterId!,
      amount: depositAmount,
      deposit_channel: depositForm.deposit_channel,
      reference_number: depositForm.reference_number || undefined,
      notes: depositForm.notes || undefined,
    });
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Loading / not found Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (loadingCluster || !cluster) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={48} />
        <Skeleton variant="rectangular" height={260} />
      </Box>
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Tab content Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Overview
        return (
          <Grid container spacing={3}>
            {[
              { label: 'Total Collected', value: totalCollected },
              { label: 'Target Amount', value: targetAmount },
              { label: 'Balance Remaining', value: balanceRemaining },
              { label: 'Total Pledges', value: totalPledged },
              { label: 'Funds with Lead (unsubmitted)', value: pendingInLeadAmount },
              { label: 'Confirmed to Treasury', value: totalConfirmedToTreasury },
              { label: 'Awaiting Confirmation', value: totalPendingToConfirm },
            ].map(({ label, value }) => (
              <Grid item xs={12} sm={6} md={4} key={label}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="h5">{fmt(value)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Progress toward target</Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(clusterProgress, 100)}
                  sx={{ height: 10, borderRadius: 5, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {clusterProgress.toFixed(1)}% of target achieved
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      case 1: // Collections
        return (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Collections ({collections.length})</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { setContribForm(f => ({ ...f, is_pledge: false })); setContribOpen(true); }}
              >
                Record Collection
              </Button>
            </Stack>
            {loadingContributions ? (
              <Skeleton variant="rectangular" height={200} />
            ) : collections.length === 0 ? (
              <Alert severity="info">No collections recorded yet. Use the button above to add one.</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Contributor</TableCell>
                      <TableCell>Mode</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collections.map((item: ClusterContribution) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">{item.contributor_name}</Typography>
                          {item.contributor_phone && (
                            <Typography variant="caption" color="text.secondary">{item.contributor_phone}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={item.payment_channel_display || item.payment_channel || '-'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{item.reference_number || '-'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {fmt(item.amount)}
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );

      case 2: // Pledges
        return (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Pledges ({pledges.length})</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => { setContribForm(f => ({ ...f, is_pledge: true })); setContribOpen(true); }}
              >
                Record Pledge
              </Button>
            </Stack>
            {loadingContributions ? (
              <Skeleton variant="rectangular" height={180} />
            ) : pledges.length === 0 ? (
              <Alert severity="info">No pledges recorded yet.</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Contributor</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pledges.map((item: ClusterContribution) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.contributor_name}</TableCell>
                        <TableCell>
                          <Typography variant="caption">{item.contributor_phone || '-'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmt(item.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={item.pledge_fulfilled ? 'Fulfilled' : 'Pending'}
                            color={item.pledge_fulfilled ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );

      case 3: // Submit to Treasury
        return (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6">Submissions to Treasurer</Typography>
                <Typography variant="body2" color="text.secondary">
                  Funds with Lead (unsubmitted): <strong>{fmt(pendingInLeadAmount)}</strong>
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<SendIcon />}
                onClick={() => {
                  setDepositForm((f) => ({ ...f, amount: pendingInLeadAmount > 0 ? String(pendingInLeadAmount) : '' }));
                  setDepositOpen(true);
                }}
              >
                Submit Funds to Treasury
              </Button>
            </Stack>
            {loadingDeposits ? (
              <Skeleton variant="rectangular" height={180} />
            ) : allDeposits.length === 0 ? (
              <Alert severity="info">No submissions recorded. Use the button above to submit collected funds to the treasurer.</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mode</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allDeposits.map((item: ClusterDeposit) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Chip label={item.deposit_channel_display || item.deposit_channel || '-'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{item.reference_number || '-'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>{fmt(item.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={item.confirmed_by_treasurer ? 'Confirmed' : 'Awaiting Confirmation'}
                            color={item.confirmed_by_treasurer ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );

      case 4: // Members
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Cluster Info</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Current lead: <strong>{cluster.cluster_lead_name || 'Unassigned'}</strong>
            </Alert>
            <List>
              <ListItem>
                <ListItemText primary={cluster.cluster_lead_name || 'No cluster lead assigned'} secondary="Cluster lead" />
              </ListItem>
            </List>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>{cluster.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Led by {cluster.cluster_lead_name || 'Unassigned'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyWhatsAppUpdate}
          >
            Copy WhatsApp Update
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            disabled={!canManageClusterTransactions}
            onClick={() => setContribOpen(true)}
          >
            Record Income
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<SendIcon />}
            disabled={!canManageClusterTransactions}
            onClick={() => {
              setDepositForm((f) => ({ ...f, amount: pendingInLeadAmount > 0 ? String(pendingInLeadAmount) : '' }));
              setDepositOpen(true);
            }}
          >
            Submit Funds
          </Button>
        </Stack>
      </Stack>

      {!canManageClusterTransactions && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Read-only access: only this cluster lead and event officials can record cluster transactions.
        </Alert>
      )}

      {whatsAppNotice && (
        <Alert severity={whatsAppNotice.type} sx={{ mb: 2 }} onClose={() => setWhatsAppNotice(null)}>
          {whatsAppNotice.message}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Contribution Template
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {'Edit the top and bottom messages plus till details. Use placeholders like {{event_name}}, {{cluster_name}}, {{target_amount}}, {{event_date}}, {{event_location}}, {{till_number}}, {{till_account_name}}.'}
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Top Message"
            multiline
            minRows={5}
            value={whatsAppTopTemplate}
            onChange={(e) => setWhatsAppTopTemplate(e.target.value)}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Till Number"
              value={tillNumber}
              onChange={(e) => setTillNumber(e.target.value)}
              fullWidth
            />
            <TextField
              label="Till Account Name"
              value={tillAccountName}
              onChange={(e) => setTillAccountName(e.target.value)}
              fullWidth
            />
          </Stack>
          <TextField
            label="Bottom Message"
            multiline
            minRows={4}
            value={whatsAppBottomMessage}
            onChange={(e) => setWhatsAppBottomMessage(e.target.value)}
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label={`Collections (${collections.length})`} />
          <Tab label={`Pledges (${pledges.length})`} />
          <Tab label={`Submissions (${allDeposits.length})`} />
          <Tab label="Info" />
        </Tabs>
      </Paper>

      <Box>{renderTabContent()}</Box>

      {/* Record Contribution Dialog */}
      <Dialog open={contribOpen} onClose={() => setContribOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{contribForm.is_pledge ? 'Record Pledge' : 'Record Collection'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Paste M-Pesa Message"
              value={rawMpesaMessage}
              onChange={e => setRawMpesaMessage(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              placeholder="Paste full M-Pesa SMS to auto-fill name, phone, amount, reference"
            />
            <Button variant="outlined" startIcon={<AutoParseIcon />} onClick={handleParseMpesaMessage}>
              Parse M-Pesa Message
            </Button>
            {parseNotice && (
              <Alert severity={parseNotice.type} onClose={() => setParseNotice(null)}>
                {parseNotice.message}
              </Alert>
            )}
            <TextField
              label="Contributor Name *"
              value={contribForm.contributor_name}
              onChange={e => setContribForm(f => ({ ...f, contributor_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Phone Number"
              value={contribForm.contributor_phone}
              onChange={e => setContribForm(f => ({ ...f, contributor_phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Amount (KES) *"
              type="number"
              value={contribForm.amount}
              onChange={e => setContribForm(f => ({ ...f, amount: e.target.value }))}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={contribForm.is_pledge}
                  onChange={e => setContribForm(f => ({ ...f, is_pledge: e.target.checked }))}
                />
              }
              label="This is a pledge (not yet paid)"
            />
            {!contribForm.is_pledge && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Payment Channel</InputLabel>
                  <Select
                    value={contribForm.payment_channel}
                    label="Payment Channel"
                    onChange={e => setContribForm(f => ({ ...f, payment_channel: e.target.value }))}
                  >
                    {PAYMENT_CHANNELS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField
                  label="Reference Number (M-Pesa code, etc.)"
                  value={contribForm.reference_number}
                  onChange={e => setContribForm(f => ({ ...f, reference_number: e.target.value }))}
                  fullWidth
                />
              </>
            )}
            <TextField
              label="Notes"
              value={contribForm.notes}
              onChange={e => setContribForm(f => ({ ...f, notes: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            {addContribMutation.isError && (
              <Alert severity="error">Failed to save. Please check the details and try again.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContribOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveContrib}
            disabled={!canManageClusterTransactions || addContribMutation.isPending || !contribForm.contributor_name || !contribForm.amount}
          >
            {addContribMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Funds to Treasury Dialog */}
      <Dialog open={depositOpen} onClose={() => setDepositOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Funds to Treasury</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Funds currently with you (unsubmitted): <strong>{fmt(pendingInLeadAmount)}</strong>
          </Alert>
          <Alert severity={clusterProgress >= 70 ? 'success' : clusterProgress >= 40 ? 'warning' : 'error'} sx={{ mb: 2 }}>
            Cluster financial progress: <strong>{clusterProgress.toFixed(1)}%</strong>
          </Alert>
          <Stack spacing={2}>
            <TextField
              label="Amount to Submit (KES) *"
              type="number"
              value={depositForm.amount}
              onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))}
              fullWidth
              inputProps={{ min: 0 }}
            />
            {exceedsLeadFunds && (
              <Alert severity="error">
                Amount exceeds funds currently with lead ({fmt(pendingInLeadAmount)}).
              </Alert>
            )}
            <FormControl fullWidth>
              <InputLabel>Deposit Channel</InputLabel>
              <Select
                value={depositForm.deposit_channel}
                label="Deposit Channel"
                onChange={e => setDepositForm(f => ({ ...f, deposit_channel: e.target.value }))}
              >
                {PAYMENT_CHANNELS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Reference / Transaction Number"
              value={depositForm.reference_number}
              onChange={e => setDepositForm(f => ({ ...f, reference_number: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Notes"
              value={depositForm.notes}
              onChange={e => setDepositForm(f => ({ ...f, notes: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            {addDepositMutation.isError && (
              <Alert severity="error">Failed to submit deposit. Please check and try again.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSaveDeposit}
            disabled={addDepositMutation.isPending || !depositForm.amount || depositAmount <= 0 || exceedsLeadFunds}
          >
            {addDepositMutation.isPending ? 'Submitting...' : 'Submit to Treasury'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClusterDetailsPage;
