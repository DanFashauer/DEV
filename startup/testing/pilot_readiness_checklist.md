# Pilot Readiness Checklist

Use this checklist to verify SignalGrid is ready for enterprise pilot deployments.

## Pre-Flight Checklist

### Infrastructure

- [ ] Server deployed and accessible
- [ ] Database configured (Redis for production)
- [ ] Environment variables set
- [ ] SSL/TLS configured
- [ ] Domain name configured
- [ ] Monitoring/alerting configured

### Authentication

- [ ] JWT authentication working
- [ ] API key authentication working
- [ ] WebAuthn registration functional
- [ ] WebAuthn authentication functional
- [ ] Step-up auth for protected operations

### Core Features

- [ ] Badge scan → session start flow works
- [ ] Session polling returns correct state
- [ ] Session termination works
- [ ] Location signal reporting works
- [ ] Policy evaluation triggers actions

### Integrations

- [ ] FleetDM posture sync works
- [ ] ITSM ticket creation works (at least one vendor)
- [ ] Webhook delivery works
- [ ] SIEM event export works
- [ ] NAC integration works (if configured)

### Security

- [ ] Rate limiting enforced
- [ ] Replay attack prevention works
- [ ] Request signing verified
- [ ] Secret redaction in logs
- [ ] Audit ledger verified
- [ ] Webhook signature verification works

## Validation Scripts

### Quick Health Check

```bash
# Server is running
curl -s http://localhost:3000

# Demo flow works
bun run demo:flow

# Audit ledger verified
bun run audit:verify
```

### Full Validation

```bash
# Start fresh
bun run dev

# Seed demo data
bun run demo:seed

# Full validation
bun run demo:validate

# Security tests
bun run test:security

# Summary
bun run test:summary
```

## Performance Gates

| Metric | Target | Critical |
|--------|--------|----------|
| Session start (p95) | < 500ms | < 1000ms |
| Policy evaluation | < 100ms | < 500ms |
| Webhook delivery | < 2s | < 5s |
| Error rate | < 1% | < 5% |
| Uptime | 99.9% | 99% |

## Demo Scenarios

### Healthcare

- Badge: `badge-healthcare-001`
- Device: `iPad-Nurse-Station-01`
- Expected: Session starts, compliance check triggers quarantine

### Retail

- Badge: `badge-retail-001`
- Device: `POS-Tablet-Store-42`
- Expected: Session starts, clean compliance

### Logistics

- Badge: `badge-logistics-001`
- Device: `Android-Warehouse-07`
- Expected: Session starts, high-risk alerts triggered

## Post-Deployment

### Day 1

- [ ] Monitor error rates
- [ ] Check audit log for anomalies
- [ ] Verify webhook deliveries
- [ ] Test admin dashboard

### Week 1

- [ ] Review session analytics
- [ ] Check policy trigger rates
- [ ] Verify SIEM events
- [ ] Test failover scenarios

### Month 1

- [ ] Performance review
- [ ] Security audit
- [ ] User feedback
- [ ] Scale testing

## Rollback Plan

If pilot fails:

1. **Identify issue** - Check logs, metrics, audit trail
2. **Communication** - Notify stakeholders
3. **Rollback** - Revert to previous version
4. **Post-mortem** - Document lessons learned

## Support Contacts

| Role | Contact |
|------|---------|
| Platform Lead | [Team email] |
| Security | [Security email] |
| On-call | [PagerDuty] |

## Sign-Off

| Role | Name | Date |
|------|------|------|
| Platform Lead | | |
| Security Lead | | |
| Product Owner | | |
