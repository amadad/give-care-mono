import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing } from '../tokens';

interface Resource {
  title: string;
  description?: string;
  phone?: string;
  website?: string;
}

interface ResourceListProps {
  resources: Resource[];
  title?: string;
}

export default function ResourceList({ resources, title = 'Resources' }: ResourceListProps) {
  return (
    <Section style={sectionStyle}>
      <Text style={titleStyle}>{title}</Text>
      {resources.map((resource, idx) => (
        <Section key={idx} style={itemStyle}>
          <Text style={resourceTitleStyle}>• {resource.title}</Text>
          {resource.description && (
            <Text style={descriptionStyle}>{resource.description}</Text>
          )}
          {resource.phone && (
            <Text style={contactStyle}>Phone: {resource.phone}</Text>
          )}
          {resource.website && (
            <Text style={contactStyle}>
              <a href={resource.website} style={linkStyle}>
                {resource.website}
              </a>
            </Text>
          )}
        </Section>
      ))}
    </Section>
  );
}

const sectionStyle = {
  marginBottom: emailSpacing.block,
};

const titleStyle = {
  ...emailTypography.heading.small,
  color: emailColors.text.primary,
  margin: `0 0 ${emailSpacing.inline} 0`,
};

const itemStyle = {
  marginBottom: emailSpacing.inline,
};

const resourceTitleStyle = {
  ...emailTypography.body.medium,
  color: emailColors.text.primary,
  fontWeight: '600' as const,
  margin: '0 0 4px 0',
};

const descriptionStyle = {
  ...emailTypography.body.small,
  color: emailColors.text.secondary,
  margin: '0 0 4px 0',
};

const contactStyle = {
  ...emailTypography.body.small,
  color: emailColors.text.muted,
  margin: '0',
};

const linkStyle = {
  color: emailColors.text.secondary,
  textDecoration: 'underline',
};
