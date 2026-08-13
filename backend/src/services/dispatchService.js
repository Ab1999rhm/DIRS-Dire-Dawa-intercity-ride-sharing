const { sendEmail } = require('./smsService');
const logger = require('../config/logger');

const TYPE_LABELS = {
  vehicle_damage: 'Lost Item',
  payment_evasion: 'Fare Dispute',
  harassment: 'Safety Concern',
  reckless_driving: 'Driver Behavior',
  assault: 'Assault',
  theft: 'Theft',
  accident: 'Accident',
  substance_abuse: 'Substance Abuse',
  vehicle_safety: 'Vehicle Safety',
  passenger_misbehavior: 'Passenger Misbehavior',
  fake_emergency: 'Fake Emergency',
  other: 'Other'
};

const buildMapsLink = (coordinates) => {
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    return `https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`;
  }
  return null;
};

const buildIncidentSummary = ({ incident, reporter, trip }) => {
  const coords = incident.location?.coordinates;
  const mapsLink = buildMapsLink(coords);
  const categoryLabel = TYPE_LABELS[incident.category] || (incident.category || 'Incident').replace(/_/g, ' ');

  const line = (label, value) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#475569;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#0f172a;">${value || 'N/A'}</td></tr>`;

  const reporterName = reporter
    ? `${reporter.firstName || ''} ${reporter.lastName || ''}`.trim() || 'Registered user'
    : (incident.reportedBy?.firstName ? `${incident.reportedBy.firstName} ${incident.reportedBy.lastName}` : 'Registered user');

  const summaryText = [
    `EMERGENCY INCIDENT — ${categoryLabel.toUpperCase()}`,
    ``,
    `Type: ${categoryLabel}`,
    `Severity: ${incident.severity}`,
    `Status: ${incident.status}`,
    `Description: ${incident.description}`,
    `Location: ${incident.location?.address || (coords ? coords.join(', ') : 'N/A')}`,
    mapsLink ? `Map: ${mapsLink}` : '',
    `Reported by: ${reporterName}${reporter?.phoneNumber ? ` (${reporter.phoneNumber})` : ''}`,
    trip ? `Trip route: ${trip.pickupLocation?.address || 'N/A'} → ${trip.dropoffLocation?.address || 'N/A'}` : '',
    `Reported at: ${new Date(incident.createdAt).toLocaleString()}`,
    `Incident ID: ${incident._id}`
  ].filter(Boolean).join('\n');

  const summaryHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
      <div style="background:#dc2626;color:#fff;padding:16px;border-radius:10px;margin-bottom:16px;">
        <strong style="font-size:16px;">🚨 EMERGENCY INCIDENT — ${categoryLabel.toUpperCase()}</strong>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${line('Type', categoryLabel)}
        ${line('Severity', incident.severity)}
        ${line('Status', incident.status)}
        ${line('Description', incident.description)}
        ${line('Location', incident.location?.address || (coords ? coords.join(', ') : 'N/A'))}
        ${mapsLink ? line('Map', `<a href="${mapsLink}" style="color:#2563eb;">Open in Google Maps</a>`) : ''}
        ${line('Reported by', reporterName)}
        ${line('Phone', reporter?.phoneNumber)}
        ${trip ? line('Trip route', `${trip.pickupLocation?.address || 'N/A'} → ${trip.dropoffLocation?.address || 'N/A'}`) : ''}
        ${line('Reported at', new Date(incident.createdAt).toLocaleString())}
        ${line('Incident ID', incident._id)}
      </table>
      <p style="font-size:11px;color:#94a3b8;margin-top:16px;">This is an automated dispatch from the DIRS Emergency Command Center.</p>
    </div>
  `;

  return { categoryLabel, summaryText, summaryHtml, mapsLink };
};

const dispatchToContacts = async ({ contacts, incident, reporter, trip, extra = {} }) => {
  const { categoryLabel, summaryText, summaryHtml } = buildIncidentSummary({ incident, reporter, trip });

  const subject = `🚨 DIRS Emergency Dispatch — ${categoryLabel}`;
  const extraLine = extra.policeReportNumber
    ? `\nPolice Report Number: ${extra.policeReportNumber}`
    : extra.hospitalName
      ? `\nDispatched to Hospital: ${extra.hospitalName}`
      : '';

  const results = [];
  for (const contact of contacts) {
    if (!contact.email) continue;
    const res = await sendEmail({
      to: contact.email,
      subject: `${subject} — ${contact.name}`,
      htmlContent: summaryHtml + (extraLine ? `<p style="font-size:13px;color:#0f172a;font-weight:600;">${extraLine.replace('\n', '<br/>')}</p>` : ''),
      textContent: summaryText + extraLine
    });
    results.push({ contact: contact.name, email: contact.email, ...res });
  }

  return { dispatched: results.filter(r => r.success).length, results };
};

module.exports = { buildIncidentSummary, dispatchToContacts };