import { useEffect, useState } from 'react';
import { AD_SIZES } from './route-planner';

export type MailerPlan = { doors: number; sizeIndex: number; summary: string };
export const PLAN_UPDATED = 'hln-plan-updated';
export const SIZE_CHANGED = 'hln-ad-size-change';
export const PLAN_REQUESTED = 'hln-plan-requested';
export function validSize(index: unknown): index is number {
  return typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < AD_SIZES.length;
}
export function useMailerPlan() {
  const [plan, setPlan] = useState<MailerPlan>({ doors: 0, sizeIndex: 0, summary: '' });
  useEffect(() => {
    const receive = (event: Event) => {
      const incoming = (event as CustomEvent<MailerPlan>).detail;
      if (incoming && validSize(incoming.sizeIndex) && Number.isSafeInteger(incoming.doors) && incoming.doors >= 0 && typeof incoming.summary === 'string') setPlan(incoming);
    };
    window.addEventListener(PLAN_UPDATED, receive);
    window.dispatchEvent(new Event(PLAN_REQUESTED));
    return () => window.removeEventListener(PLAN_UPDATED, receive);
  }, []);
  return plan;
}
export function chooseMailerSize(sizeIndex: number) {
  if (validSize(sizeIndex)) window.dispatchEvent(new CustomEvent(SIZE_CHANGED, { detail: sizeIndex }));
}
