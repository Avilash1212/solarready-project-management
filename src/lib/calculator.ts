import { Project, MaterialShortage, DelayCalculationResult, ProjectStatus } from '@/types';

/**
 * Delay forecasting calculation based on the heuristic requested:
 * Estimated delay days = max(0, expected delivery days + remaining installation work days - available schedule buffer days)
 *
 * For active shortages that are unresolved:
 * If a shortage is resolved or received, it does not induce an ongoing schedule delay.
 */
export function calculateShortageDelay(
  expectedDeliveryDays: number,
  remainingInstallationDays: number,
  scheduleBufferDays: number,
  plannedCompletionDate?: string
): DelayCalculationResult {
  const delivery = Math.max(0, Number(expectedDeliveryDays) || 0);
  const remaining = Math.max(0, Number(remainingInstallationDays) || 0);
  const buffer = Math.max(0, Number(scheduleBufferDays) || 0);

  const estimatedDelayDays = Math.max(0, delivery + remaining - buffer);

  let riskStatus: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
  if (estimatedDelayDays > 5) {
    riskStatus = 'delayed';
  } else if (estimatedDelayDays > 0 || buffer <= 1) {
    riskStatus = 'at_risk';
  }

  // Calculate projected completion date
  let projectedCompletionDate = plannedCompletionDate || '2026-11-01';
  if (plannedCompletionDate) {
    const plannedDate = new Date(plannedCompletionDate);
    if (!isNaN(plannedDate.getTime())) {
      const projected = new Date(plannedDate);
      projected.setDate(projected.getDate() + estimatedDelayDays);
      projectedCompletionDate = projected.toISOString().split('T')[0];
    }
  }

  let explanation = '';
  if (estimatedDelayDays === 0) {
    explanation = `Schedule buffer (${buffer}d) is sufficient to absorb expected delivery (${delivery}d) + installation (${remaining}d).`;
  } else {
    explanation = `Delivery (${delivery}d) + installation (${remaining}d) exceeds available buffer (${buffer}d) by ${estimatedDelayDays} day(s).`;
  }

  return {
    expectedDeliveryDays: delivery,
    remainingInstallationDays: remaining,
    scheduleBufferDays: buffer,
    estimatedDelayDays,
    riskStatus,
    projectedCompletionDate,
    explanation,
  };
}

/**
 * Determine a project's overall status and aggregate delay across its active shortages.
 * Non-overlapping simplified heuristic: taking the maximum critical path shortage delay.
 */
export function calculateProjectMetrics(project: Project, shortages: MaterialShortage[]) {
  const projectShortages = shortages.filter((s) => s.projectId === project.id);
  const activeShortages = projectShortages.filter(
    (s) => s.status !== 'resolved' && s.status !== 'received'
  );

  if (project.actualCompletionDate) {
    return {
      status: 'completed' as ProjectStatus,
      maxEstimatedDelay: 0,
      openShortagesCount: 0,
      totalShortagesCount: projectShortages.length,
      projectedCompletionDate: project.actualCompletionDate,
      riskLevel: 'low',
    };
  }

  if (activeShortages.length === 0) {
    return {
      status: 'on_track' as ProjectStatus,
      maxEstimatedDelay: 0,
      openShortagesCount: 0,
      totalShortagesCount: projectShortages.length,
      projectedCompletionDate: project.plannedCompletionDate,
      riskLevel: 'low',
    };
  }

  // Calculate delay per shortage and find critical path (max delay to avoid double counting)
  let maxDelay = 0;
  for (const shortage of activeShortages) {
    const calc = calculateShortageDelay(
      shortage.expectedDeliveryDays,
      shortage.remainingInstallationDays,
      shortage.scheduleBufferDays,
      project.plannedCompletionDate
    );
    if (calc.estimatedDelayDays > maxDelay) {
      maxDelay = calc.estimatedDelayDays;
    }
  }

  let status: ProjectStatus = 'on_track';
  if (maxDelay > 5) {
    status = 'delayed';
  } else if (maxDelay > 0 || activeShortages.length > 0) {
    status = 'at_risk';
  }

  // Projected completion date with max delay added
  let projectedDate = project.plannedCompletionDate;
  const plannedDate = new Date(project.plannedCompletionDate);
  if (!isNaN(plannedDate.getTime())) {
    const proj = new Date(plannedDate);
    proj.setDate(proj.getDate() + maxDelay);
    projectedDate = proj.toISOString().split('T')[0];
  }

  return {
    status,
    maxEstimatedDelay: maxDelay,
    openShortagesCount: activeShortages.length,
    totalShortagesCount: projectShortages.length,
    projectedCompletionDate: projectedDate,
    riskLevel: maxDelay > 5 ? 'critical' : maxDelay > 0 ? 'warning' : 'info',
  };
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}
