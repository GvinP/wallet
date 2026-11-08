import { makeAutoObservable, observableRef } from 'mobx';
import type { Address, Hash } from 'viem';

import type { NetworkId, TokenSymbol } from '@/core/chain/networks';
import type { FeeEstimate } from '@/core/chain/send';
import type { SendErrorKind } from '@/core/chain/transfer';

/** Frozen snapshot of what the user reviewed — exactly this is signed and sent. */
export type ReviewedTransfer = {
  networkId: NetworkId;
  token: TokenSymbol;
  to: Address;
  amount: bigint;
  fee: FeeEstimate;
};

export type SendPhase = 'editing' | 'authorized' | 'sending' | 'sent' | 'error';

/** An authorization is consumed by the status screen and expires quickly. */
const AUTH_TTL_MS = 60_000;

/** In-memory state of the send flow (no secrets; never persisted). */
export class SendDraft {
  token: TokenSymbol = 'POL';
  recipient = '';
  amount = '';
  review: ReviewedTransfer | null = null;
  phase: SendPhase = 'editing';
  authorizedAt: number | null = null;
  hash: Hash | null = null;
  errorKind: SendErrorKind | null = null;

  constructor() {
    // The reviewed snapshot is stored by reference: exactly what was shown gets signed.
    makeAutoObservable(this, { review: observableRef });
  }

  reset() {
    this.token = 'POL';
    this.recipient = '';
    this.amount = '';
    this.review = null;
    this.phase = 'editing';
    this.authorizedAt = null;
    this.hash = null;
    this.errorKind = null;
  }

  setToken(token: TokenSymbol) {
    this.token = token;
    this.amount = '';
  }

  setRecipient(value: string) {
    this.recipient = value;
  }

  setAmount(value: string) {
    this.amount = value;
  }

  setReview(review: ReviewedTransfer) {
    this.review = review;
    this.phase = 'editing';
    this.authorizedAt = null;
  }

  /** Called right after a successful biometric/PIN check on the confirm screen. */
  authorize(now = Date.now()) {
    if (!this.review) return;
    this.phase = 'authorized';
    this.authorizedAt = now;
  }

  /**
   * Atomically takes the authorization: returns the reviewed transfer once, or null if it was
   * never authorized, already used, or expired. Prevents double sends on re-renders.
   */
  consumeAuthorization(now = Date.now()): ReviewedTransfer | null {
    if (this.phase !== 'authorized' || this.authorizedAt === null || !this.review) return null;
    if (now - this.authorizedAt > AUTH_TTL_MS) {
      this.phase = 'editing';
      this.authorizedAt = null;
      return null;
    }
    this.phase = 'sending';
    this.authorizedAt = null;
    return this.review;
  }

  markSent(hash: Hash) {
    this.phase = 'sent';
    this.hash = hash;
  }

  markFailed(kind: SendErrorKind) {
    this.phase = 'error';
    this.errorKind = kind;
  }
}
