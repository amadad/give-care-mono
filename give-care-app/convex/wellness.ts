"use server";

import { query } from './_generated/server';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { getByExternalId } from './core';
import { CATALOG, type AssessmentSlug, type AssessmentAnswer } from './lib/assessmentCatalog';

type StatusTrend = 'up' | 'down' | 'steady' | 'unknown';

const toAssessmentAnswers = (answers: Doc<'assessments'>['answers']): AssessmentAnswer[] =>
  answers.map((answer, idx) => ({
    questionIndex: Number.isNaN(Number.parseInt(answer.questionId, 10))
      ? idx
      : Number.parseInt(answer.questionId, 10),
    value: answer.value,
  }));

const computePressureZones = (
  definitionId: string,
  answers: Doc<'assessments'>['answers']
): string[] => {
  const catalog = CATALOG[definitionId as AssessmentSlug];
  if (!catalog) return [];
  try {
    return catalog.score(toAssessmentAnswers(answers)).pressureZones;
  } catch (error) {
    console.warn('[domains/wellness] Failed to compute pressure zones', {
      definitionId,
      error,
    });
    return [];
  }
};

const trendFromHistory = (history: Array<{ score: number }>): StatusTrend => {
  if (history.length === 0) return 'unknown';
  if (history.length === 1) return 'steady';

  const [latest, previous] = history;
  if (latest.score > previous.score) return 'up';
  if (latest.score < previous.score) return 'down';
  return 'steady';
};

export const getStatus = query({
  args: {
    userId: v.string(),
    recentLimit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, recentLimit = 5 }) => {
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      return {
        hasData: false,
        pressureZones: [],
        latestScore: null,
        latestBand: null,
        averageScore: null,
        trend: 'unknown' as StatusTrend,
        dataPoints: [],
      };
    }

    const scoreDocs = await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(recentLimit);

    const history = [];
    for (const score of scoreDocs) {
      const assessment = await ctx.db.get(score.assessmentId);
      if (!assessment) continue;
      history.push({
        assessmentId: score.assessmentId,
        definitionId: assessment.definitionId,
        score: score.composite,
        band: score.band,
        pressureZones: computePressureZones(assessment.definitionId, assessment.answers),
        updatedAt: assessment._creationTime,
      });
    }

    const latest = history[0];
    const averageScore =
      history.length === 0
        ? null
        : Number(
            (history.reduce((sum, entry) => sum + entry.score, 0) / history.length).toFixed(2)
          );

    return {
      hasData: history.length > 0,
      pressureZones: latest?.pressureZones ?? [],
      latestScore: latest?.score ?? null,
      latestBand: latest?.band ?? null,
      averageScore,
      trend: trendFromHistory(history),
      dataPoints: history,
    };
  },
});
