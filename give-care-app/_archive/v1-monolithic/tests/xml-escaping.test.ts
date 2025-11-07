import { describe, it, expect } from 'vitest';

/**
 * XML escaping function (copy from convex/http.ts for testing)
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

describe('XML Escaping Security', () => {
  it('escapes XML special characters', () => {
    expect(escapeXML('Hello & goodbye')).toBe('Hello &amp; goodbye');
    expect(escapeXML('5 < 10')).toBe('5 &lt; 10');
    expect(escapeXML('10 > 5')).toBe('10 &gt; 5');
    expect(escapeXML('Say "hi"')).toBe('Say &quot;hi&quot;');
    expect(escapeXML("It's ok")).toBe('It&apos;s ok');
  });

  it('prevents XML injection attacks', () => {
    const malicious = '</Message><Call><To>+15555555555</To></Call><Message>';
    const escaped = escapeXML(malicious);

    // Ensure no XML tags remain
    expect(escaped).not.toContain('</Message>');
    expect(escaped).not.toContain('<Call>');
    expect(escaped).not.toContain('<To>');

    // Verify complete escaping
    expect(escaped).toBe(
      '&lt;/Message&gt;&lt;Call&gt;&lt;To&gt;+15555555555&lt;/To&gt;&lt;/Call&gt;&lt;Message&gt;'
    );
  });

  it('prevents script injection via XML', () => {
    const malicious = '<script>alert("XSS")</script>';
    const escaped = escapeXML(malicious);

    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('</script>');
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('handles markdown formatting safely', () => {
    const markdown = '**Bold** text with *italics*';
    const escaped = escapeXML(markdown);

    // Markdown asterisks are safe in XML (no angle brackets)
    expect(escaped).toBe(markdown);
  });

  it('handles empty strings', () => {
    expect(escapeXML('')).toBe('');
  });

  it('handles strings with only special characters', () => {
    expect(escapeXML('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&apos;');
  });

  it('handles nested special characters', () => {
    const nested = '<div class="test" data-value=\'5 & 6\'>';
    const escaped = escapeXML(nested);

    expect(escaped).toBe(
      '&lt;div class=&quot;test&quot; data-value=&apos;5 &amp; 6&apos;&gt;'
    );
  });

  it('escapes ampersands before other entities', () => {
    // This tests that & is escaped first, preventing double-escaping issues
    const input = 'A & B < C';
    const escaped = escapeXML(input);

    expect(escaped).toBe('A &amp; B &lt; C');
    // Should NOT be 'A &amp;amp; B &amp;lt; C'
  });

  it('handles SMS-appropriate content safely', () => {
    const smsMessage =
      'Your wellness score: 45/100\n\n' +
      'For crisis support, text HOME to 741741 or call 988.\n\n' +
      'Want to see strategies that might help?';

    const escaped = escapeXML(smsMessage);

    // Numbers, slashes, and newlines should pass through
    expect(escaped).toContain('45/100');
    expect(escaped).toContain('\n');

    // No XML injection possible
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });

  it('handles agent responses with assessment questions', () => {
    const question =
      'On a scale from 1-5:\n' +
      '1 = Not at all\n' +
      '5 = Extremely often\n\n' +
      'How often do you feel emotionally drained?';

    const escaped = escapeXML(question);

    // Should preserve formatting
    expect(escaped).toContain('1 = Not at all');
    expect(escaped).toContain('5 = Extremely often');

    // No XML injection
    expect(escaped).not.toContain('<');
  });

  it('prevents TwiML response hijacking', () => {
    // Attacker tries to close Message tag and add a Call
    const malicious =
      'Your score is high. </Message><Response><Call><To>evil@attacker.com</To></Call></Response><Message>';

    const escaped = escapeXML(malicious);

    // All tags escaped
    expect(escaped).toContain('&lt;/Message&gt;');
    expect(escaped).toContain('&lt;Response&gt;');
    expect(escaped).toContain('&lt;Call&gt;');

    // No actual XML elements present
    expect(escaped.match(/<[^>]+>/g)).toBeNull();
  });

  it('handles unicode characters safely', () => {
    const unicode = 'Support: 💙 < 3';
    const escaped = escapeXML(unicode);

    // Emoji preserved, angle bracket escaped
    expect(escaped).toBe('Support: 💙 &lt; 3');
  });
});
