import { CareerData } from './types';

export function exportToMarkdown(data: CareerData): string {
  const lines: string[] = ['# Career Assistant Export\n'];

  // Profile
  if (data.profile) {
    lines.push('## Profile');
    lines.push(`- **Name:** ${data.profile.name}`);
    lines.push(`- **Role:** ${data.profile.currentRole}`);
    lines.push(`- **Experience:** ${data.profile.yearsExperience} years`);
    lines.push(`- **Function:** ${data.profile.function}`);
    lines.push('');
  }

  // Wins
  if (data.wins.length > 0) {
    lines.push('## Wins');
    for (const win of data.wins) {
      lines.push(`### ${win.title}`);
      lines.push(`- **Before:** ${win.before}`);
      lines.push(`- **Insight:** ${win.insight}`);
      lines.push(`- **Action:** ${win.action}`);
      lines.push(`- **After:** ${win.after}`);
      if (win.metrics.length) lines.push(`- **Metrics:** ${win.metrics.join(', ')}`);
      lines.push('');
    }
  }

  // GRIP Narratives
  if (data.gripNarratives.length > 0) {
    lines.push('## GRIP Narratives');
    for (const grip of data.gripNarratives) {
      const company = data.companies.find((c) => c.id === grip.companyId);
      lines.push(`### ${company?.name || 'General'}`);
      lines.push(`- **Gap:** ${grip.gap}`);
      lines.push(`- **Result:** ${grip.result}`);
      lines.push(`- **Input Levers:**`);
      for (const lever of grip.inputLevers) {
        lines.push(`  - ${lever.lever} (${lever.contribution}): ${lever.detail}`);
      }
      lines.push(`- **Plan:** ${grip.plan}`);
      lines.push('');
    }
  }

  // Elevator Pitches
  if (data.elevatorPitches.length > 0) {
    lines.push('## Elevator Pitches');
    for (const pitch of data.elevatorPitches) {
      const company = data.companies.find((c) => c.id === pitch.companyId);
      lines.push(`### ${company?.name || 'General'}`);
      lines.push(`**Stranger (10s):** ${pitch.stranger10s}`);
      lines.push(`**Recruiter (30s):** ${pitch.recruiter30s}`);
      lines.push(`**Peer (2min):** ${pitch.peer2min}`);
      lines.push('');
    }
  }

  // Resume Narratives
  if (data.resumeNarratives.length > 0) {
    lines.push('## Resume Narratives');
    for (const rn of data.resumeNarratives) {
      const company = data.companies.find((c) => c.id === rn.companyId);
      lines.push(`### ${company?.name || 'Unknown'}`);
      lines.push(rn.narrative);
      lines.push('');
    }
  }

  // Cold Emails
  if (data.coldEmails.length > 0) {
    lines.push('## Cold Email Templates');
    for (const email of data.coldEmails) {
      const company = data.companies.find((c) => c.id === email.companyId);
      lines.push(`### ${company?.name || 'Unknown'} (${email.recipientType})`);
      lines.push(`**Subject:** ${email.subject}`);
      lines.push('');
      lines.push(email.body);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
