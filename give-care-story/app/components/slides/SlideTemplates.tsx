"use client";

import { ReactNode } from 'react';
import { SlideLayout } from './SlideLayout';
import {
  BigHeadline,
  SupportingText,
  AnimatedList,
  StatGrid,
  ProgressiveReveal,
  Comparison,
  TwoColumnLayout
} from './PresentationComponents';
import { CenteredContent } from './ContentLayout';

interface TitleSlideProps {
  title: string;
  subtitle?: string;
  supporting?: string;
  variant?: 'cream' | 'dark';
}

export function TitleSlide({ title, subtitle, supporting, variant = 'cream' }: TitleSlideProps) {
  return (
    <SlideLayout variant={variant}>
      <CenteredContent>
        <BigHeadline size="3xl">{title}</BigHeadline>
        {subtitle && (
          <SupportingText delay={0.4} className="mt-8">
            {subtitle}
          </SupportingText>
        )}
        {supporting && (
          <SupportingText delay={0.6} className="mt-6 text-2xl opacity-70">
            {supporting}
          </SupportingText>
        )}
      </CenteredContent>
    </SlideLayout>
  );
}

interface ContentSlideProps {
  headline: string;
  items: string[];
  variant?: 'cream' | 'dark';
  supporting?: string;
}

export function ContentSlide({ headline, items, variant = 'cream', supporting }: ContentSlideProps) {
  return (
    <SlideLayout variant={variant}>
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 max-w-7xl mx-auto">
        <BigHeadline size="2xl" className="mb-12">
          {headline}
        </BigHeadline>
        <AnimatedList items={items} startDelay={0.5} />
        {supporting && (
          <SupportingText delay={0.8 + items.length * 0.2} className="mt-12 text-2xl italic opacity-80">
            {supporting}
          </SupportingText>
        )}
      </div>
    </SlideLayout>
  );
}

interface Stat {
  value: string;
  label: string;
  description?: string;
}

interface StatSlideProps {
  headline: string;
  subheadline?: string;
  stats: Stat[];
  columns?: 2 | 3 | 4;
  variant?: 'cream' | 'dark';
  footer?: string;
}

export function StatSlide({
  headline,
  subheadline,
  stats,
  columns = 3,
  variant = 'cream',
  footer
}: StatSlideProps) {
  return (
    <SlideLayout variant={variant}>
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-6">
            {headline}
          </BigHeadline>
          {subheadline && (
            <SupportingText delay={0.3} className="mb-12">
              {subheadline}
            </SupportingText>
          )}
          <StatGrid stats={stats} columns={columns} startDelay={0.5} />
          {footer && (
            <SupportingText delay={1.0 + stats.length * 0.1} className="mt-12 text-2xl italic opacity-80 text-center">
              {footer}
            </SupportingText>
          )}
        </div>
      </div>
    </SlideLayout>
  );
}

interface TwoColumnSlideProps {
  headline: string;
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
  variant?: 'cream' | 'dark';
}

export function TwoColumnSlide({
  headline,
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
  variant = 'dark'
}: TwoColumnSlideProps) {
  return (
    <SlideLayout variant={variant}>
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-12">
            {headline}
          </BigHeadline>
          <TwoColumnLayout
            leftDelay={0.5}
            rightDelay={0.7}
            left={
              <div>
                <h3 className="font-heading text-3xl md:text-4xl mb-6">{leftTitle}</h3>
                <AnimatedList items={leftItems} startDelay={0.8} staggerDelay={0.15} />
              </div>
            }
            right={
              <div>
                <h3 className="font-heading text-3xl md:text-4xl mb-6">{rightTitle}</h3>
                <AnimatedList items={rightItems} startDelay={1.0} staggerDelay={0.15} />
              </div>
            }
          />
        </div>
      </div>
    </SlideLayout>
  );
}

interface ComparisonSlideProps {
  headline: string;
  comparisons: Array<{ wrong: string; right: string; title?: string }>;
  variant?: 'cream' | 'dark';
  footer?: string;
}

export function ComparisonSlide({
  headline,
  comparisons,
  variant = 'dark',
  footer
}: ComparisonSlideProps) {
  return (
    <SlideLayout variant={variant}>
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-12">
            {headline}
          </BigHeadline>
          <div className="space-y-8">
            {comparisons.map((comparison, index) => (
              <div key={index}>
                {comparison.title && (
                  <h3 className="font-heading text-2xl md:text-3xl mb-4 opacity-90">
                    {comparison.title}
                  </h3>
                )}
                <Comparison
                  wrong={comparison.wrong}
                  right={comparison.right}
                  startDelay={0.5 + index * 0.4}
                />
              </div>
            ))}
          </div>
          {footer && (
            <SupportingText
              delay={1.0 + comparisons.length * 0.4}
              className="mt-12 text-2xl italic opacity-80 text-center"
            >
              {footer}
            </SupportingText>
          )}
        </div>
      </div>
    </SlideLayout>
  );
}

interface QuestionSlideProps {
  question: string;
  answer: string;
  variant?: 'cream' | 'dark';
}

export function QuestionSlide({ question, answer, variant = 'dark' }: QuestionSlideProps) {
  return (
    <SlideLayout variant={variant}>
      <CenteredContent>
        <BigHeadline size="2xl" className="mb-12">
          {question}
        </BigHeadline>
        <SupportingText delay={0.6} className="text-3xl">
          {answer}
        </SupportingText>
      </CenteredContent>
    </SlideLayout>
  );
}
