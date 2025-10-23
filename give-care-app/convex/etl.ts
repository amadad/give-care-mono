/**
 * ETL Pipeline Convex Mutations and Queries
 *
 * Called by give-care-etl Cloudflare Workers to persist workflow state
 * Read by admin-frontend for real-time dashboard updates
 *
 * Updated for 3-agent architecture (v0.3.0):
 * - Orchestrator → Discovery → Extraction (handles categorization + validation)
 */

import { v } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'

/**
 * Create a new ETL workflow
 * Called by Orchestrator Agent when workflow starts
 */
export const createWorkflow = mutation({
  args: {
    sessionId: v.string(),
    task: v.string(),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
    trigger: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workflowId = await ctx.db.insert('etlWorkflows', {
      sessionId: args.sessionId,
      task: args.task,
      state: args.state,
      limit: args.limit,
      trigger: args.trigger,
      currentStep: 'discovery',
      status: 'running',
      sourcesCount: 0,
      extractedCount: 0,
      validatedCount: 0,
      errorCount: 0,
      errors: [],
      startedAt: Date.now(),
    })

    return { workflowId }
  },
})

/**
 * Update workflow progress
 * Called by agents as they progress through steps
 *
 * Note: categorizedCount removed in v0.3.0 (categorization now part of extraction)
 */
export const updateWorkflow = mutation({
  args: {
    sessionId: v.string(),
    currentStep: v.optional(v.string()),
    status: v.optional(v.string()),
    sourcesCount: v.optional(v.number()),
    extractedCount: v.optional(v.number()),
    validatedCount: v.optional(v.number()),
    errorCount: v.optional(v.number()),
    errors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query('etlWorkflows')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .first()

    if (!workflow) {
      throw new Error(`Workflow not found: ${args.sessionId}`)
    }

    const updates: any = {}
    if (args.currentStep !== undefined) updates.currentStep = args.currentStep
    if (args.status !== undefined) updates.status = args.status
    if (args.sourcesCount !== undefined) updates.sourcesCount = args.sourcesCount
    if (args.extractedCount !== undefined) updates.extractedCount = args.extractedCount
    if (args.validatedCount !== undefined) updates.validatedCount = args.validatedCount
    if (args.errorCount !== undefined) updates.errorCount = args.errorCount
    if (args.errors !== undefined) updates.errors = args.errors

    // If status is completed or failed, set completedAt
    if (args.status === 'completed' || args.status === 'failed') {
      updates.completedAt = Date.now()
      updates.durationMs = Date.now() - workflow.startedAt
    }

    await ctx.db.patch(workflow._id, updates)

    return { success: true }
  },
})

/**
 * Add discovered source
 * Called by Discovery Agent
 */
export const addSource = mutation({
  args: {
    sessionId: v.string(),
    url: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    sourceType: v.string(),
    trustScore: v.number(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query('etlWorkflows')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .first()

    if (!workflow) {
      throw new Error(`Workflow not found: ${args.sessionId}`)
    }

    const sourceId = await ctx.db.insert('etlSources', {
      workflowId: workflow._id,
      url: args.url,
      title: args.title,
      description: args.description,
      sourceType: args.sourceType,
      trustScore: args.trustScore,
      discoveredAt: Date.now(),
    })

    // Update workflow sourcesCount
    await ctx.db.patch(workflow._id, {
      sourcesCount: workflow.sourcesCount + 1,
    })

    return { sourceId }
  },
})

/**
 * Add extracted record
 * Called by Extraction Agent
 */
export const addExtractedRecord = mutation({
  args: {
    sessionId: v.string(),
    sourceId: v.id('etlSources'),
    title: v.string(),
    providerName: v.string(),
    phones: v.array(v.string()),
    website: v.string(),
    serviceTypes: v.array(v.string()),
    coverage: v.string(),
    state: v.optional(v.string()),
    county: v.optional(v.string()),
    zipCodes: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    cost: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query('etlWorkflows')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .first()

    if (!workflow) {
      throw new Error(`Workflow not found: ${args.sessionId}`)
    }

    const recordId = await ctx.db.insert('etlExtractedRecords', {
      workflowId: workflow._id,
      sourceId: args.sourceId,
      title: args.title,
      providerName: args.providerName,
      phones: args.phones,
      website: args.website,
      serviceTypes: args.serviceTypes,
      coverage: args.coverage,
      state: args.state,
      county: args.county,
      zipCodes: args.zipCodes,
      description: args.description,
      eligibility: args.eligibility,
      cost: args.cost,
      extractedAt: Date.now(),
      validationStatus: 'pending',
    })

    // Update workflow extractedCount
    await ctx.db.patch(workflow._id, {
      extractedCount: workflow.extractedCount + 1,
    })

    return { recordId }
  },
})

/**
 * Add validated record (ready for QA)
 * Called by Validator Agent
 */
export const addValidatedRecord = mutation({
  args: {
    sessionId: v.string(),
    extractedRecordId: v.optional(v.id('etlExtractedRecords')), // Optional for Phase 1
    title: v.string(),
    providerName: v.string(),
    phones: v.array(v.string()),
    website: v.string(),
    serviceTypes: v.array(v.string()),
    zones: v.array(v.string()),
    coverage: v.string(),
    state: v.optional(v.string()),
    county: v.optional(v.string()),
    zipCodes: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    cost: v.optional(v.string()),
    qualityScore: v.number(),
    phoneValidation: v.object({
      valid: v.boolean(),
      normalized: v.array(v.string()),
    }),
    urlValidation: v.object({
      valid: v.boolean(),
      statusCode: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query('etlWorkflows')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .first()

    if (!workflow) {
      throw new Error(`Workflow not found: ${args.sessionId}`)
    }

    const recordId = await ctx.db.insert('etlValidatedRecords', {
      workflowId: workflow._id,
      extractedRecordId: args.extractedRecordId,
      title: args.title,
      providerName: args.providerName,
      phones: args.phones,
      website: args.website,
      serviceTypes: args.serviceTypes,
      zones: args.zones,
      coverage: args.coverage,
      state: args.state,
      county: args.county,
      zipCodes: args.zipCodes,
      description: args.description,
      eligibility: args.eligibility,
      cost: args.cost,
      qualityScore: args.qualityScore,
      phoneValidation: args.phoneValidation,
      urlValidation: args.urlValidation,
      validatedAt: Date.now(),
      qaStatus: 'pending',
    })

    // Update workflow validatedCount
    await ctx.db.patch(workflow._id, {
      validatedCount: workflow.validatedCount + 1,
    })

    // Mark extracted record as validated (only if it exists)
    if (args.extractedRecordId) {
      await ctx.db.patch(args.extractedRecordId, {
        validationStatus: 'passed',
      })
    }

    return { recordId }
  },
})

/**
 * Get all workflows (for dashboard)
 */
export const listWorkflows = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50

    let workflows

    if (args.status !== undefined) {
      workflows = await ctx.db
        .query('etlWorkflows')
        .withIndex('by_status', q => q.eq('status', args.status!))
        .order('desc')
        .take(limit)
    } else {
      workflows = await ctx.db
        .query('etlWorkflows')
        .withIndex('by_started')
        .order('desc')
        .take(limit)
    }

    return workflows
  },
})

/**
 * Get single workflow details
 */
export const getWorkflow = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query('etlWorkflows')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .first()

    if (!workflow) {
      return null
    }

    // Get sources
    const sources = await ctx.db
      .query('etlSources')
      .withIndex('by_workflow', q => q.eq('workflowId', workflow._id))
      .collect()

    // Get validated records ready for QA
    const validatedRecords = await ctx.db
      .query('etlValidatedRecords')
      .withIndex('by_workflow', q => q.eq('workflowId', workflow._id))
      .collect()

    return {
      ...workflow,
      sources,
      validatedRecords,
    }
  },
})

/**
 * Get QA queue (validated records pending review)
 */
export const getQAQueue = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100

    const records = await ctx.db
      .query('etlValidatedRecords')
      .withIndex('by_qa_status', q => q.eq('qaStatus', 'pending'))
      .order('desc')
      .take(limit)

    return records
  },
})

/**
 * Approve QA record (move to production)
 */
export const approveQARecord = mutation({
  args: {
    recordId: v.id('etlValidatedRecords'),
    userId: v.id('users'),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      qaStatus: 'approved',
      qaReviewedAt: Date.now(),
      qaReviewedBy: args.userId,
      qaFeedback: args.feedback,
    })

    // TODO: In Phase 2, insert into production resources table
    // await ctx.db.insert("resources", { ... });

    return { success: true }
  },
})

/**
 * Reject QA record
 */
export const rejectQARecord = mutation({
  args: {
    recordId: v.id('etlValidatedRecords'),
    userId: v.id('users'),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      qaStatus: 'rejected',
      qaReviewedAt: Date.now(),
      qaReviewedBy: args.userId,
      qaFeedback: args.feedback,
    })

    return { success: true }
  },
})

/**
 * Get ETL dashboard stats
 */
export const getDashboardStats = query({
  handler: async ctx => {
    const workflows = await ctx.db.query('etlWorkflows').collect()

    const running = workflows.filter(w => w.status === 'running').length
    const completed = workflows.filter(w => w.status === 'completed').length
    const failed = workflows.filter(w => w.status === 'failed').length

    const totalSources = workflows.reduce((sum, w) => sum + w.sourcesCount, 0)
    const totalExtracted = workflows.reduce((sum, w) => sum + w.extractedCount, 0)
    const totalValidated = workflows.reduce((sum, w) => sum + w.validatedCount, 0)
    const totalErrors = workflows.reduce((sum, w) => sum + w.errorCount, 0)

    const qaQueue = await ctx.db
      .query('etlValidatedRecords')
      .withIndex('by_qa_status', q => q.eq('qaStatus', 'pending'))
      .collect()

    const qaApproved = await ctx.db
      .query('etlValidatedRecords')
      .withIndex('by_qa_status', q => q.eq('qaStatus', 'approved'))
      .collect()

    return {
      workflows: {
        total: workflows.length,
        running,
        completed,
        failed,
      },
      records: {
        sources: totalSources,
        extracted: totalExtracted,
        validated: totalValidated,
        errors: totalErrors,
      },
      qa: {
        pending: qaQueue.length,
        approved: qaApproved.length,
      },
      lastRun: workflows.length > 0 ? Math.max(...workflows.map(w => w.startedAt)) : null,
    }
  },
})
