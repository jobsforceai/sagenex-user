'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, Globe, Loader2, ShieldCheck, Timer } from 'lucide-react';

import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  consumeOnlineTestSession,
  getOnlineTestsCatalog,
  getOnlineTestQuestion,
  getOnlineTestState,
  endOnlineTestAttempt,
  purchaseOnlineTest,
  sendOnlineTestOtp,
  saveOnlineTestAnswer,
  startOnlineTestAttempt,
  submitOnlineTestAttempt,
} from '@/actions/user';

type OnlineTestCatalogItem = {
  testId: string;
  title?: string;
  name?: string;
  heading?: string;
  description?: string;
  instructions?: string;
  priceUSD?: number;
  durationMinutes?: number;
  passPercentage?: number;
};

type OnlineTestPurchase = {
  attemptsPurchased?: number;
  attemptsUsed?: number;
  attemptsRemaining?: number;
  status?: string;
};

type OnlineTestAttempt = {
  attemptId: string;
  status?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  startedAt?: string;
  expiresAt?: string;
  answeredCount?: number;
  lastAnsweredIndex?: number;
  nextQuestionIndex?: number;
  language?: string;
  timeRemainingSeconds?: number;
  session?: {
    launchToken?: string;
    expiresAt?: string;
  };
  score?: number;
  percentage?: number;
  passed?: boolean;
};

type OnlineQuestionOption = {
  optionId: string;
  text: string;
};

type OnlineQuestion = {
  questionId: string;
  section?: string;
  sectionTitle?: string;
  prompt: string;
  options: OnlineQuestionOption[];
};

type OnlineQuestionResponse = {
  attemptId: string;
  index: number;
  totalQuestions: number;
  timeRemainingSeconds: number;
  question: OnlineQuestion;
  selectedOptionId?: string | null;
};

type OnlineAttemptResult = {
  status?: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
  totalQuestions?: number;
};

type Stage = 'catalog' | 'purchase' | 'language' | 'resume' | 'exam' | 'result';

type LanguageOption = {
  code: string;
  label: string;
};

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
];

const AUTOPROCTOR_URL =
  process.env.NEXT_PUBLIC_AUTOPROCTOR_URL ||
  'https://www.autoproctor.co/tests/Tc5KmQhvUh/instructions/';
const STORAGE_TEST_ID = 'onlineExamTestId';
const STORAGE_LANGUAGE = 'onlineExamLanguage';

const getErrorMessage = (err: any, fallback: string) =>
  err?.data?.message || err?.message || fallback;

const getTestTitle = (test: OnlineTestCatalogItem) =>
  test.title || test.heading || test.name || test.testId || 'Online Test';

const getTestDescription = (test: OnlineTestCatalogItem) =>
  test.description || test.instructions || 'Complete the online exam at your own pace.';

const formatPrice = (value?: number) =>
  value === undefined || value === null ? 'N/A' : `$${value.toFixed(2)}`;

const formatDuration = (minutes?: number) => {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining.toString().padStart(2, '0')}m`;
};

const formatTimeRemaining = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null) return 'N/A';
  const clamped = Math.max(0, seconds);
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : 'N/A';

export default function OnlineTestsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('catalog');
  const [catalog, setCatalog] = useState<OnlineTestCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selectedTest, setSelectedTest] = useState<OnlineTestCatalogItem | null>(null);
  const [purchaseInfo, setPurchaseInfo] = useState<OnlineTestPurchase | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseMethod, setPurchaseMethod] = useState<'otp' | 'password'>('otp');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [otpValidUntil, setOtpValidUntil] = useState<string | null>(null);
  const [otpRemainingAttempts, setOtpRemainingAttempts] = useState<number | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [purchaseKey, setPurchaseKey] = useState('');
  const [stateLoading, setStateLoading] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);

  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [languageReady, setLanguageReady] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<OnlineTestAttempt | null>(null);
  const [question, setQuestion] = useState<OnlineQuestionResponse | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerSaving, setAnswerSaving] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const [embeddedInit, setEmbeddedInit] = useState(false);
  const [autoStartTriggered, setAutoStartTriggered] = useState(false);
  const [endingAttempt, setEndingAttempt] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<OnlineAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const languageLabel = useMemo(
    () => LANGUAGES.find((lang) => lang.code === language)?.label || language,
    [language]
  );


  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?next=/tests/online');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setEmbedded(window.self !== window.top);
    } catch {
      setEmbedded(true);
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_LANGUAGE);
    if (storedLanguage && LANGUAGES.some((lang) => lang.code === storedLanguage)) {
      setLanguage(storedLanguage);
    }
    setLanguageReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_LANGUAGE, language);
  }, [language]);


  useEffect(() => {
    if (!loading && isAuthenticated) {
      const loadCatalog = async () => {
        setCatalogLoading(true);
        setCatalogError(null);
        try {
          const res = await getOnlineTestsCatalog();
          if (res.error) {
            throw new Error(res.error);
          }
          if (Array.isArray(res)) {
            setCatalog(res);
          } else {
            setCatalog(res.tests || res.catalog || []);
          }
        } catch (err: any) {
          setCatalogError(getErrorMessage(err, 'Failed to load online tests.'));
        } finally {
          setCatalogLoading(false);
        }
      };

      loadCatalog();
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (!embedded || embeddedInit || catalogLoading || stage !== 'catalog') return;
    if (typeof window === 'undefined') return;
    if (catalog.length === 0) return;

    const storedTestId = window.localStorage.getItem(STORAGE_TEST_ID);
    const test =
      catalog.find((item) => item.testId === storedTestId) || catalog[0] || null;
    if (test) {
      setEmbeddedInit(true);
      handleSelectTest(test);
    }
  }, [embedded, embeddedInit, catalogLoading, stage, catalog]);


  useEffect(() => {
    if (stage !== 'exam') return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  const resetExamState = () => {
    setSelectedTest(null);
    setPurchaseInfo(null);
    setPurchaseError(null);
    setPurchaseMethod('otp');
    setOtpCode('');
    setPassword('');
    setOtpValidUntil(null);
    setOtpRemainingAttempts(null);
    setOtpLoading(false);
    setOtpError(null);
    setPurchaseKey('');
    setStartError(null);
    setAttempt(null);
    setQuestion(null);
    setQuestionError(null);
    setQuestionLoading(false);
    setSelectedOptionId(null);
    setAnswerSaving(false);
    setAnswerError(null);
    setSessionToken(null);
    setSessionLoading(false);
    setSessionError(null);
    setAutoStartTriggered(false);
    setEndingAttempt(false);
    setEndError(null);
    setTimeRemaining(null);
    setResult(null);
    setSubmitting(false);
    setStateLoading(false);
    setStateError(null);
    setStage('catalog');
    setAutoStartTriggered(false);
    router.replace('/tests/online');
  };

  const consumeSessionToken = async (token: string) => {
    setSessionLoading(true);
    setSessionError(null);
    try {
      const res = await consumeOnlineTestSession(token);
      if (res.error) {
        throw new Error(res.error);
      }
    } catch (err: any) {
      const message = getErrorMessage(err, 'Failed to launch the secure session.');
      setSessionError(message);
      throw new Error(message);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleLaunchExam = async () => {
    if (!selectedTest) return;
    if (embedded) {
      await beginAttempt();
      return;
    }

    if (!AUTOPROCTOR_URL.startsWith('https://')) {
      setStartError('AutoProctor URL is not configured.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_TEST_ID, selectedTest.testId);
      window.localStorage.setItem(STORAGE_LANGUAGE, language);
      window.open(AUTOPROCTOR_URL, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSelectTest = async (test: OnlineTestCatalogItem) => {
    setSelectedTest(test);
    setPurchaseInfo(null);
    setPurchaseError(null);
    setPurchaseLoading(false);
    setPurchaseMethod('otp');
    setOtpCode('');
    setPassword('');
    setOtpValidUntil(null);
    setOtpRemainingAttempts(null);
    setOtpLoading(false);
    setOtpError(null);
    setStartError(null);
    setQuestion(null);
    setQuestionError(null);
    setSelectedOptionId(null);
    setAnswerError(null);
    setResult(null);
    setAttempt(null);
    setTimeRemaining(null);
    setStateError(null);
    setSessionToken(null);
    setSessionError(null);
    setAutoStartTriggered(false);
    setEndingAttempt(false);
    setEndError(null);
    setStateLoading(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_TEST_ID, test.testId);
    }

    try {
      const res = await getOnlineTestState(test.testId);
      if (res.error) {
        throw new Error(res.error);
      }
      const state = res.state as string;
      if (state === 'NOT_PURCHASED') {
        setPurchaseKey(`online_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        setStage('purchase');
        return;
      }
      if (state === 'PURCHASED') {
        setPurchaseInfo(res.purchase || null);
        if (res.purchase?.attemptsRemaining === 0) {
          setPurchaseKey(`online_${Date.now()}_${Math.random().toString(36).slice(2)}`);
          setStage('purchase');
        } else {
          setStage('language');
        }
        return;
      }
      if (state === 'IN_PROGRESS') {
        const attemptPayload: OnlineTestAttempt = res.attempt || null;
        if (!attemptPayload?.attemptId) {
          throw new Error('Unable to resume the attempt.');
        }
        setAttempt(attemptPayload);
        if (attemptPayload.language) {
          setLanguage(attemptPayload.language);
        }
        setTimeRemaining(attemptPayload.timeRemainingSeconds ?? null);
        setStage('resume');
        return;
      }
      if (state === 'EXPIRED' || state === 'SUBMITTED') {
        setResult(res.attempt || null);
        setStage('result');
        return;
      }
      setStage('purchase');
    } catch (err: any) {
      setStateError(getErrorMessage(err, 'Failed to load test state.'));
      setStage('catalog');
    } finally {
      setStateLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!selectedTest) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await sendOnlineTestOtp({ testId: selectedTest.testId });
      if (res.error) {
        throw new Error(res.error);
      }
      setOtpValidUntil(res.otpValidUntil || null);
      setOtpRemainingAttempts(res.remainingAttempts ?? null);
    } catch (err: any) {
      setOtpError(getErrorMessage(err, 'Failed to send OTP.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedTest) return;
    const trimmedOtp = otpCode.trim();
    const trimmedPassword = password.trim();
    if (purchaseMethod === 'otp' && !trimmedOtp) {
      setPurchaseError('OTP is required to purchase attempts.');
      return;
    }
    if (purchaseMethod === 'password' && !trimmedPassword) {
      setPurchaseError('Password is required to purchase attempts.');
      return;
    }

    const idempotencyKey =
      purchaseKey || `online_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (!purchaseKey) {
      setPurchaseKey(idempotencyKey);
    }

    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      const res = await purchaseOnlineTest({
        testId: selectedTest.testId,
        idempotencyKey,
        otp: purchaseMethod === 'otp' ? trimmedOtp : undefined,
        password: purchaseMethod === 'password' ? trimmedPassword : undefined,
      });
      if (res.error) {
        throw new Error(res.error);
      }
      setPurchaseInfo(res.purchase || null);
      setStage('language');
    } catch (err: any) {
      setPurchaseError(getErrorMessage(err, 'Failed to purchase attempts.'));
    } finally {
      setPurchaseLoading(false);
    }
  };

  const loadQuestion = async (
    attemptId: string,
    index: number,
    overrideLanguage?: string,
    overrideSession?: string
  ) => {
    setQuestionLoading(true);
    setQuestionError(null);
    try {
      const questionLanguage = overrideLanguage || language;
      const activeSession = overrideSession || sessionToken || undefined;
      if (!activeSession) {
        throw new Error('Session token missing for this attempt.');
      }
      const res = await getOnlineTestQuestion(attemptId, index, questionLanguage, activeSession);
      if (res.error) {
        throw new Error(res.error);
      }
      if (res.expired) {
        setResult(res.attempt || null);
        setStage('result');
        return;
      }
      const questionPayload = res as OnlineQuestionResponse;
      setQuestion(questionPayload);
      setSelectedOptionId(questionPayload.selectedOptionId || null);
      setTimeRemaining(questionPayload.timeRemainingSeconds ?? null);
    } catch (err: any) {
      setQuestionError(getErrorMessage(err, 'Failed to load the question.'));
    } finally {
      setQuestionLoading(false);
    }
  };

  const beginAttempt = async () => {
    if (!selectedTest) return;
    setStartLoading(true);
    setStartError(null);
    try {
      const res = await startOnlineTestAttempt({
        testId: selectedTest.testId,
        language,
      });
      if (res.error) {
        throw new Error(res.error);
      }
      if (!res.attempt?.attemptId) {
        throw new Error('Attempt could not be started.');
      }
      const attemptPayload: OnlineTestAttempt = res.attempt;
      const launchToken = attemptPayload.session?.launchToken;
      if (!launchToken) {
        throw new Error('Session token could not be issued.');
      }
      setAttempt(attemptPayload);
      if (attemptPayload.language) {
        setLanguage(attemptPayload.language);
      }
      setSessionToken(launchToken);
      setQuestion(null);
      setQuestionError(null);
      setStage('exam');
      await consumeSessionToken(launchToken);
      setTimeRemaining(attemptPayload.timeRemainingSeconds ?? null);
      const nextIndex = attemptPayload.nextQuestionIndex || 1;
      await loadQuestion(
        attemptPayload.attemptId,
        nextIndex,
        attemptPayload.language || language,
        launchToken
      );
    } catch (err: any) {
      setStartError(getErrorMessage(err, 'Failed to start the attempt.'));
    } finally {
      setStartLoading(false);
    }
  };

  const handleSelectOption = async (optionId: string) => {
    if (!attempt || !question || answerSaving) return;
    if (!sessionToken) {
      setAnswerError('Session token missing. Please resume the attempt.');
      return;
    }
    if (selectedOptionId === optionId) return;
    setSelectedOptionId(optionId);
    setAnswerSaving(true);
    setAnswerError(null);
    try {
      const res = await saveOnlineTestAnswer(
        attempt.attemptId,
        {
          questionId: question.question.questionId,
          optionId,
        },
        sessionToken
      );
      if (res.error) {
        throw new Error(res.error);
      }
      if (res.expired) {
        setResult(res.attempt || null);
        setStage('result');
      }
    } catch (err: any) {
      setAnswerError(getErrorMessage(err, 'Failed to save your answer.'));
    } finally {
      setAnswerSaving(false);
    }
  };

  const handleExamLanguageChange = async (value: string) => {
    setLanguage(value);
    if (!attempt || !question) return;
    if (questionLoading) return;
    await loadQuestion(attempt.attemptId, question.index, value);
  };

  useEffect(() => {
    if (!embedded || autoStartTriggered || !languageReady) return;
    if (!selectedTest) return;
    if (stage !== 'language' && stage !== 'resume') return;
    if (!sessionToken) {
      setAutoStartTriggered(true);
      void beginAttempt();
    }
  }, [embedded, autoStartTriggered, stage, selectedTest, sessionToken, languageReady]);

  const handleSubmitAttempt = async () => {
    if (!attempt) return;
    if (!sessionToken) {
      setQuestionError('Session token missing. Please resume the attempt.');
      return;
    }
    setSubmitting(true);
    setQuestionError(null);
    try {
      const res = await submitOnlineTestAttempt(attempt.attemptId, sessionToken);
      if (res.error) {
        throw new Error(res.error);
      }
      setResult(res.attempt || res);
      setStage('result');
    } catch (err: any) {
      setQuestionError(getErrorMessage(err, 'Failed to submit the attempt.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndExam = async () => {
    if (!attempt) return;
    if (!sessionToken) {
      setEndError('Session token missing. Please resume the attempt.');
      return;
    }
    setEndingAttempt(true);
    setEndError(null);
    try {
      const res = await endOnlineTestAttempt(attempt.attemptId, sessionToken);
      if (res.error) {
        throw new Error(res.error);
      }
      setResult(res.attempt || res);
      setStage('result');
    } catch (err: any) {
      setEndError(getErrorMessage(err, 'Failed to end the attempt.'));
    } finally {
      setEndingAttempt(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalQuestions = question?.totalQuestions || attempt?.totalQuestions || 0;
  const currentIndex = question?.index || 1;
  const completedCount = totalQuestions ? Math.min(currentIndex, totalQuestions) : 0;
  const remainingCount = totalQuestions ? Math.max(totalQuestions - completedCount, 0) : 0;
  const progressPercent = totalQuestions
    ? Math.min(Math.round((completedCount / totalQuestions) * 100), 100)
    : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-b from-black via-[#0b1310] to-[#0f1d17] text-white pt-32 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <Button asChild variant="outline" className="mb-6">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>

            <div className="mb-10 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Online Exam
              </span>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
                Online Tests
              </h1>
              <p className="text-white/70 text-base md:text-lg max-w-2xl leading-relaxed">
                Start instantly after purchase. Each purchase includes two attempts and you can resume any in-progress
                attempt at any time.
              </p>
            </div>

            {stage === 'catalog' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-300" />
                      <div>
                        <p className="text-sm font-semibold">Two attempts included</p>
                        <p className="text-xs text-white/60">Purchase once, attempt twice.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <Timer className="h-5 w-5 text-emerald-300" />
                      <div>
                        <p className="text-sm font-semibold">Timed assessments</p>
                        <p className="text-xs text-white/60">Track your countdown in real time.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-emerald-300" />
                      <div>
                        <p className="text-sm font-semibold">Multi-language support</p>
                        <p className="text-xs text-white/60">Choose English, Hindi, or Telugu.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {catalogLoading && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                    Loading online tests...
                  </div>
                )}

                {stateLoading && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                    Checking test status...
                  </div>
                )}

                {catalogError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {catalogError}
                  </div>
                )}

                {stateError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {stateError}
                  </div>
                )}

                {!catalogLoading && !catalogError && catalog.length === 0 && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                    No online tests are available right now.
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                  {catalog.map((test) => (
                      <div
                        key={test.testId}
                        className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-emerald-500/5"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                                Online test
                              </p>
                              <h2 className="text-xl font-semibold">{getTestTitle(test)}</h2>
                            </div>
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                              {formatPrice(test.priceUSD)}
                            </span>
                          </div>
                          <p className="text-sm text-white/70">{getTestDescription(test)}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs text-white/70">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Duration</p>
                              <p className="text-sm text-white">{formatDuration(test.durationMinutes)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Pass mark</p>
                              <p className="text-sm text-white">
                                {test.passPercentage !== undefined ? `${test.passPercentage}%` : '70%'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="mt-6 w-full"
                          onClick={() => handleSelectTest(test)}
                          disabled={stateLoading}
                        >
                          Pay & Start
                        </Button>
                      </div>
                  ))}
                </div>
              </div>
            )}

            {stage === 'purchase' && selectedTest && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                      Selected test
                    </p>
                    <h2 className="text-2xl font-semibold">{getTestTitle(selectedTest)}</h2>
                    <p className="mt-2 text-sm text-white/70">
                      {getTestDescription(selectedTest)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Price</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatPrice(selectedTest.priceUSD)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Attempts</p>
                      <p className="mt-2 text-lg font-semibold text-white">2 included</p>
                      <p className="text-xs text-white/50">Each purchase gives two attempts.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                  <div>
                    <p className="text-sm font-semibold">Verify to purchase</p>
                    <p className="text-xs text-white/60">
                      Provide either OTP or your account password.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseMethod('otp');
                        setPassword('');
                        setPurchaseError(null);
                        setOtpError(null);
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        purchaseMethod === 'otp'
                          ? 'border-emerald-400/60 bg-emerald-500/15'
                          : 'border-white/10 bg-white/5 hover:border-emerald-400/40'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">OTP</p>
                      <p className="text-xs text-white/60">Send a one-time code</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseMethod('password');
                        setOtpCode('');
                        setPurchaseError(null);
                        setOtpError(null);
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        purchaseMethod === 'password'
                          ? 'border-emerald-400/60 bg-emerald-500/15'
                          : 'border-white/10 bg-white/5 hover:border-emerald-400/40'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">Password</p>
                      <p className="text-xs text-white/60">Use your login password</p>
                    </button>
                  </div>

                  {purchaseMethod === 'otp' ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">One-time password</p>
                        <Button
                          variant="outline"
                          onClick={handleSendOtp}
                          disabled={otpLoading}
                          className="h-9"
                        >
                          {otpLoading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending...
                            </span>
                          ) : (
                            'Send OTP'
                          )}
                        </Button>
                      </div>
                      <Input
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value)}
                        placeholder="Enter OTP"
                        inputMode="numeric"
                      />
                      <div className="text-xs text-white/50 space-y-1">
                        <p>Valid until: {formatDateTime(otpValidUntil)}</p>
                        <p>
                          Remaining OTP attempts:{' '}
                          {otpRemainingAttempts !== null ? otpRemainingAttempts : 'N/A'}
                        </p>
                      </div>
                      {otpError && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                          {otpError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-white">Account password</p>
                      <Input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                      />
                    </div>
                  )}

                  {purchaseError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                      {purchaseError}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <Button onClick={handleConfirmPurchase} disabled={purchaseLoading}>
                      {purchaseLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Confirming...
                        </span>
                      ) : (
                        'Confirm Purchase'
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetExamState}>
                      Back to tests
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {stage === 'language' && selectedTest && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Selected test</p>
                    <h2 className="text-2xl font-semibold">{getTestTitle(selectedTest)}</h2>
                    <p className="mt-2 text-sm text-white/70">{getTestDescription(selectedTest)}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Price</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatPrice(selectedTest.priceUSD)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Attempts</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {purchaseInfo?.attemptsRemaining !== undefined
                          ? `${purchaseInfo.attemptsRemaining} remaining`
                          : 'Available with purchase'}
                      </p>
                      <p className="text-xs text-white/50">Two attempts per purchase.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Choose your language</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setLanguage(lang.code)}
                          className={`rounded-xl border px-4 py-3 text-left transition ${
                            language === lang.code
                              ? 'border-emerald-400/60 bg-emerald-500/15'
                              : 'border-white/10 bg-white/5 hover:border-emerald-400/40'
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{lang.label}</p>
                          <p className="text-xs text-white/60">{lang.code.toUpperCase()}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/50">
                      Language locks when you start. You can change later when supported.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Ready to begin?</p>
                    <ul className="space-y-2 text-sm text-white/70">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        One question per screen with Back/Next navigation.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        Timer starts once the attempt begins.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        Refreshing restores the latest attempt state.
                      </li>
                    </ul>
                  </div>

                  {startError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                      {startError}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <Button onClick={handleLaunchExam} disabled={startLoading}>
                      {startLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Starting attempt...
                        </span>
                      ) : (
                        'Start Attempt'
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetExamState}>
                      Back to tests
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {stage === 'resume' && selectedTest && attempt && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                      Attempt in progress
                    </p>
                    <h2 className="text-2xl font-semibold">{getTestTitle(selectedTest)}</h2>
                    <p className="mt-2 text-sm text-white/70">
                      Your last attempt is still active. Resume to continue where you left off.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Next question</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {attempt.nextQuestionIndex || 1} of {attempt.totalQuestions || 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Time remaining</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatTimeRemaining(timeRemaining)}
                      </p>
                      <p className="text-xs text-white/50">Timer continues in the background.</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                    <p>Language: {languageLabel}</p>
                    <p>Answered: {attempt.answeredCount ?? 0}</p>
                    <p>Attempt ID: {attempt.attemptId}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Ready to resume?</p>
                    <ul className="space-y-2 text-sm text-white/70">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        A fresh proctoring session token will be issued.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        You will continue from the next unanswered question.
                      </li>
                    </ul>
                  </div>

                  {startError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                      {startError}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <Button onClick={handleLaunchExam} disabled={startLoading}>
                      {startLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Resuming...
                        </span>
                      ) : (
                        'Resume Attempt'
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetExamState}>
                      Back to tests
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {stage === 'exam' && attempt && selectedTest && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Attempt live</p>
                    <h2 className="text-2xl font-semibold">{getTestTitle(selectedTest)}</h2>
                    <p className="mt-1 text-sm text-white/60">Language: {languageLabel}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/70">
                      Question {currentIndex} of {totalQuestions}
                    </div>
                    <div className="min-w-[160px]">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Language</p>
                      <Select value={language} onValueChange={handleExamLanguageChange}>
                        <SelectTrigger className="mt-1 h-9 border-white/10 bg-black/30 text-white">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {sessionLoading && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                    Launching secure session...
                  </div>
                )}

                {sessionError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {sessionError}
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
                    <p>
                      Progress: {completedCount} done / {remainingCount} left
                    </p>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400/80 transition-[width]"
                      style={{ width: `${progressPercent}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {questionLoading && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                    Loading question...
                  </div>
                )}

                {questionError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {questionError}
                  </div>
                )}

                {question && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                          {question.question.sectionTitle || question.question.section || 'Section'}
                        </p>
                        <h3 className="mt-3 text-lg md:text-xl font-semibold leading-relaxed whitespace-pre-line">
                          {question.question.prompt}
                        </h3>
                      </div>
                      <div className="text-right">
                        <Button
                          variant="outline"
                          className="border-red-500/40 text-red-200 hover:border-red-400/70 hover:text-red-100"
                          onClick={handleEndExam}
                          disabled={endingAttempt}
                        >
                          {endingAttempt ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Ending...
                            </span>
                          ) : (
                            'End Exam'
                          )}
                        </Button>
                        <p className="mt-2 text-xs text-white/60">
                          End the exam here before exiting.
                        </p>
                        {endError && (
                          <p className="mt-2 text-xs text-red-200">{endError}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {question.question.options.map((option) => {
                        const isSelected = selectedOptionId === option.optionId;
                        return (
                          <button
                            key={option.optionId}
                            type="button"
                            onClick={() => handleSelectOption(option.optionId)}
                            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? 'border-emerald-400/60 bg-emerald-500/15'
                                : 'border-white/10 bg-black/30 hover:border-emerald-400/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                                  isSelected
                                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                                    : 'border-white/20 text-white/60'
                                }`}
                              >
                                {option.optionId}
                              </span>
                              <span className="text-sm  text-white/90">{option.text}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {answerSaving && (
                      <p className="text-xs text-white/60">Saving answer...</p>
                    )}
                    {answerError && (
                      <p className="text-xs text-red-200">{answerError}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => loadQuestion(attempt.attemptId, Math.max(1, currentIndex - 1))}
                        disabled={currentIndex === 1 || questionLoading}
                      >
                        Back
                      </Button>
                      {currentIndex < totalQuestions ? (
                        <Button
                          onClick={() => loadQuestion(attempt.attemptId, currentIndex + 1)}
                          disabled={questionLoading}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button onClick={handleSubmitAttempt} disabled={submitting}>
                          {submitting ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            'Submit Attempt'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {stage === 'result' && result && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Attempt completed</p>
                  <h2 className="text-2xl font-semibold">Your Results</h2>
                  <p className="text-sm text-white/60">Review your score and attempt summary below.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Status</p>
                    <p className="mt-2 text-lg font-semibold text-white">{result.status || 'Completed'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Score</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {result.score !== undefined ? result.score : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Percentage</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {result.percentage !== undefined ? `${result.percentage}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold">
                    {result.passed ? 'Passed' : 'Result pending or not passed'}
                  </p>
                  <p className="text-xs text-white/60">
                    Passing unlocks bonuses. If you have remaining attempts, you can try again.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={resetExamState}>Back to tests</Button>
                  {selectedTest && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.replace('/tests/online');
                        setAttempt(null);
                        setQuestion(null);
                        setQuestionError(null);
                        setSelectedOptionId(null);
                        setAnswerError(null);
                        setTimeRemaining(null);
                        setSessionToken(null);
                        setSessionLoading(false);
                        setSessionError(null);
                        setAutoStartTriggered(false);
                        setStage('language');
                        setResult(null);
                      }}
                    >
                      Start another attempt
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
