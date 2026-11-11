import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Mic, X, History as HistoryIcon, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Operator = "+" | "-" | "*" | "/" | null;

interface LastOperation {
  operand: number;
  op: Operator;
}

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

const HISTORY_STORAGE_KEY = "dakhli_calc_history";

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [expressionPreview, setExpressionPreview] = useState<string>("");
  const [lastOperation, setLastOperation] = useState<LastOperation | null>(
    null,
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"keypad" | "history">("keypad");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const recognitionRef = useRef<any>(null);

  // Load history from localStorage on mount (max 100)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored).slice(0, 100));
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  // Save history to localStorage (max 100)
  const saveHistory = useCallback((newItems: HistoryItem[]) => {
    const capped = newItems.slice(0, 100);
    setHistory(capped);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(capped));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const addHistoryEntry = useCallback(
    (expr: string, res: string) => {
      const newItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        expression: expr,
        result: res,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...history].slice(0, 100);
      saveHistory(updated);
    },
    [history, saveHistory],
  );

  const handleClearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  // Full reset (AC)
  const handleAllClear = useCallback(() => {
    setDisplayValue("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpressionPreview("");
    setLastOperation(null);
  }, []);

  // Clear current input only (C)
  const handleClearCurrent = useCallback(() => {
    setDisplayValue("0");
  }, []);

  // Clean arithmetic formatting without JS float noise (e.g. 0.1 + 0.2 = 0.3)
  const formatResult = (num: number): string => {
    if (isNaN(num) || !isFinite(num)) return "Error";
    if (Number.isInteger(num)) {
      if (Math.abs(num) >= 1e11) {
        return num.toExponential(5).replace(/\+/, "");
      }
      return String(num);
    }
    // Round to 10 significant digits to eliminate floating point artifacts
    const rounded = parseFloat(num.toPrecision(10));
    if (
      Math.abs(rounded) >= 1e11 ||
      (Math.abs(rounded) < 1e-6 && rounded !== 0)
    ) {
      return rounded.toExponential(5).replace(/\+/, "");
    }
    return String(rounded);
  };

  // Format number for display with standard thousand-separator commas
  const formatNumber = (numStr: string): string => {
    if (numStr === "Error" || numStr === "Infinity" || numStr === "-Infinity")
      return "Error";
    if (numStr.includes("e")) return numStr;
    const parts = numStr.split(".");
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? `.${parts[1]}` : "";
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return formattedInteger + decimalPart;
  };

  // Dynamic iPhone-style auto-scaling font size using explicit pixels (immune to root rem scale)
  const getDisplayFontSize = (formattedStr: string): string => {
    const len = formattedStr.length;
    if (len <= 6) return "text-[54px]";
    if (len === 7) return "text-[46px]";
    if (len === 8) return "text-[40px]";
    if (len === 9) return "text-[36px]";
    if (len <= 11) return "text-[32px]";
    if (len <= 13) return "text-[28px]";
    return "text-[24px]";
  };

  // Format operator symbol for expression preview
  const getOpSymbol = (op: Operator): string => {
    switch (op) {
      case "+":
        return "+";
      case "-":
        return "−";
      case "*":
        return "×";
      case "/":
        return "÷";
      default:
        return "";
    }
  };

  // Handle number digit press
  const handleDigit = useCallback(
    (digit: string) => {
      // If a calculation was just completed with '=' and no new operator chosen, start clean
      if (waitingForOperand && operator === null) {
        setDisplayValue(digit);
        setWaitingForOperand(false);
        setExpressionPreview("");
        setLastOperation(null);
        return;
      }

      if (waitingForOperand) {
        setDisplayValue(digit);
        setWaitingForOperand(false);
      } else {
        if (displayValue === "0" && digit !== ".") {
          setDisplayValue(digit);
        } else {
          // Limit maximum numeric digits to 10 like standard handheld calculators
          const rawDigits = displayValue.replace(/[^0-9]/g, "");
          if (rawDigits.length < 10) {
            setDisplayValue(displayValue + digit);
          }
        }
      }
    },
    [displayValue, waitingForOperand, operator],
  );

  // Handle decimal dot
  const handleDecimal = useCallback(() => {
    if (waitingForOperand && operator === null) {
      setDisplayValue("0.");
      setWaitingForOperand(false);
      setExpressionPreview("");
      setLastOperation(null);
      return;
    }

    if (waitingForOperand) {
      setDisplayValue("0.");
      setWaitingForOperand(false);
      return;
    }

    if (!displayValue.includes(".")) {
      setDisplayValue(displayValue + ".");
    }
  }, [displayValue, waitingForOperand, operator]);

  // Perform basic arithmetic operation
  const calculate = (prev: number, current: number, op: Operator): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "*":
        return prev * current;
      case "/":
        return current === 0 ? NaN : prev / current;
      default:
        return current;
    }
  };

  // Handle operator (+, -, *, /)
  const handleOperator = useCallback(
    (nextOperator: Operator) => {
      const inputValue = parseFloat(displayValue);

      if (previousValue === null) {
        setPreviousValue(displayValue);
        setExpressionPreview(
          `${formatNumber(displayValue)} ${getOpSymbol(nextOperator)}`,
        );
      } else if (operator && !waitingForOperand) {
        const prev = parseFloat(previousValue);
        const result = calculate(prev, inputValue, operator);

        if (isNaN(result) || !isFinite(result)) {
          setDisplayValue("Error");
          setPreviousValue(null);
          setOperator(null);
          setWaitingForOperand(true);
          setExpressionPreview("");
          return;
        }

        const resultStr = formatResult(result);
        setDisplayValue(resultStr);
        setPreviousValue(resultStr);
        setExpressionPreview(
          `${formatNumber(resultStr)} ${getOpSymbol(nextOperator)}`,
        );
      } else {
        // Change current operator while waiting for operand
        setExpressionPreview(
          `${formatNumber(previousValue)} ${getOpSymbol(nextOperator)}`,
        );
      }

      setWaitingForOperand(true);
      setOperator(nextOperator);
      setLastOperation(null);
    },
    [displayValue, previousValue, operator, waitingForOperand],
  );

  // Handle equals (=)
  const handleEquals = useCallback(() => {
    // Repeated '=' press behaves like iPhone calculator (repeats last operation)
    if (!operator && lastOperation && previousValue === null) {
      const current = parseFloat(displayValue);
      const result = calculate(
        current,
        lastOperation.operand,
        lastOperation.op,
      );
      const resultStr = formatResult(result);
      const expr = `${formatNumber(displayValue)} ${getOpSymbol(lastOperation.op)} ${formatNumber(String(lastOperation.operand))}`;
      setExpressionPreview(`${expr} =`);
      setDisplayValue(resultStr);
      addHistoryEntry(expr, resultStr);
      return;
    }

    if (!operator || previousValue === null) return;

    const prev = parseFloat(previousValue);
    const current = parseFloat(displayValue);

    const opSymbol = getOpSymbol(operator);
    const expr = `${formatNumber(previousValue)} ${opSymbol} ${formatNumber(displayValue)}`;
    setExpressionPreview(`${expr} =`);

    const result = calculate(prev, current, operator);
    const resultStr = formatResult(result);
    setDisplayValue(resultStr);
    addHistoryEntry(expr, resultStr);

    setLastOperation({ operand: current, op: operator });
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [operator, previousValue, displayValue, lastOperation, addHistoryEntry]);

  // Handle negation (+/-)
  const handleNegate = useCallback(() => {
    if (displayValue === "0" || displayValue === "Error") return;
    if (displayValue.startsWith("-")) {
      setDisplayValue(displayValue.slice(1));
    } else {
      setDisplayValue("-" + displayValue);
    }
  }, [displayValue]);

  // Handle percentage (%)
  const handlePercentage = useCallback(() => {
    const val = parseFloat(displayValue);
    if (isNaN(val)) return;

    if (previousValue !== null && operator) {
      // In additions/subtractions like 200 + 10%, calculate 10% of 200 = 20
      if (operator === "+" || operator === "-") {
        const prev = parseFloat(previousValue);
        const percentValue = (prev * val) / 100;
        setDisplayValue(formatResult(percentValue));
      } else {
        // In multiplications/divisions, 10% is 0.1
        const percentValue = val / 100;
        setDisplayValue(formatResult(percentValue));
      }
    } else {
      const percentValue = val / 100;
      setDisplayValue(formatResult(percentValue));
    }
  }, [displayValue, previousValue, operator]);

  // Handle backspace delete (swipe or key)
  const handleBackspace = useCallback(() => {
    if (waitingForOperand || displayValue === "Error") {
      setDisplayValue("0");
      return;
    }
    if (displayValue.length > 1) {
      if (displayValue.length === 2 && displayValue.startsWith("-")) {
        setDisplayValue("0");
      } else {
        setDisplayValue(displayValue.slice(0, -1));
      }
    } else {
      setDisplayValue("0");
    }
  }, [displayValue, waitingForOperand]);

  // Select item from history
  const handleSelectHistory = (item: HistoryItem) => {
    setDisplayValue(item.result);
    setExpressionPreview(`${item.expression} =`);
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    setViewMode("keypad");
  };

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === "history") {
        if (e.key === "Escape" || e.key === "Backspace") {
          e.preventDefault();
          setViewMode("keypad");
        }
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === "+") {
        e.preventDefault();
        handleOperator("+");
      } else if (e.key === "-") {
        e.preventDefault();
        handleOperator("-");
      } else if (e.key === "*" || e.key === "x" || e.key === "X") {
        e.preventDefault();
        handleOperator("*");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("/");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (displayValue !== "0") {
          handleClearCurrent();
        } else {
          handleAllClear();
        }
      } else if (e.key === "%") {
        e.preventDefault();
        handlePercentage();
      } else if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setViewMode((v) => (v === "keypad" ? "history" : "keypad"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    viewMode,
    displayValue,
    handleDigit,
    handleDecimal,
    handleOperator,
    handleEquals,
    handleBackspace,
    handleClearCurrent,
    handleAllClear,
    handlePercentage,
    onClose,
  ]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Voice speech dictation support for microphone pill
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const sanitized = transcript
          .replace(/plus/g, "+")
          .replace(/minus/g, "-")
          .replace(/times|multiplied by/g, "*")
          .replace(/divided by/g, "/")
          .replace(/[^0-9+\-*/.]/g, "");

        if (sanitized) {
          try {
            // eslint-disable-next-line no-eval
            const computed = Function(`'use strict'; return (${sanitized})`)();
            if (typeof computed === "number" && !isNaN(computed)) {
              setExpressionPreview(transcript);
              const resStr = formatResult(computed);
              setDisplayValue(resStr);
              setWaitingForOperand(true);
              addHistoryEntry(transcript, resStr);
            }
          } catch {
            // Ignore speech parse errors
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  const formattedDisplay = formatNumber(displayValue);
  const isInputNonZero = displayValue !== "0" && displayValue !== "Error";

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#181A20] sm:bg-black/75 sm:backdrop-blur-md select-none overflow-hidden sm:overflow-y-auto animate-fade-in p-0 sm:p-4"
    >
      {/* Emulator Chassis: Fixed Substantial Size on Desktop (460x820), Full Screen on Mobile */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex flex-col justify-between w-full h-[100dvh] sm:h-[820px] sm:w-[460px] sm:max-w-[460px] animate-scale-in",
          "p-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-5",
          "bg-[#181A20] sm:rounded-[44px] sm:border sm:border-white/[0.08] sm:shadow-[0_32px_80px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.06)] sm:overflow-hidden",
        )}
      >
        {/* Ambient Warm Orange Glow in bottom-right corner */}
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar: Voice + History Toggle on Left & Close Button on Right */}
        <div className="flex items-center justify-between w-full pt-1 sm:pt-0 z-10 mb-1.5 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              title={
                isListening
                  ? "Listening... click to stop"
                  : "Voice calculation input"
              }
              className={cn(
                "w-10 h-9 rounded-[13px] flex items-center justify-center transition-all cursor-pointer touch-manipulation",
                isListening
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                  : "bg-[#2B2E38] hover:bg-[#343844] text-slate-300 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
              )}
            >
              <Mic className="w-4 h-4" strokeWidth={1.8} />
            </button>

            {/* History Toggle Button */}
            <button
              type="button"
              onClick={() =>
                setViewMode((v) => (v === "keypad" ? "history" : "keypad"))
              }
              title={
                viewMode === "keypad"
                  ? "View Calculation History"
                  : "Back to Keypad"
              }
              className={cn(
                "w-10 h-9 rounded-[13px] flex items-center justify-center transition-all cursor-pointer touch-manipulation",
                viewMode === "history"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-[#2B2E38] hover:bg-[#343844] text-slate-300 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
              )}
            >
              <HistoryIcon className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calculator"
            className="w-9 h-9 rounded-full bg-[#252832] hover:bg-[#323644] text-slate-400 hover:text-white flex items-center justify-center transition-colors shadow-md border border-white/10 active:scale-90 cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode: Keypad vs History inside the exact same fixed chassis */}
        <div className="flex-1 min-h-0 flex flex-col justify-between w-full">
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "keypad" ? (
              <motion.div
                key="keypad"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col justify-between flex-1 w-full"
              >
                {/* Screen Display Area: Spacious vertical height, ample margin above buttons */}
                <div className="w-full flex-1 sm:flex-none sm:h-[135px] flex flex-col justify-end px-3 z-10 mb-3 sm:mb-2 pb-2">
                  {/* Previous Expression Line */}
                  <div className="text-right text-[15px] font-light text-slate-400 font-mono tracking-tight min-h-[22px] leading-tight truncate select-text mb-1.5">
                    {expressionPreview}
                  </div>

                  {/* Primary Result Display with dynamic font size (never touches button row) */}
                  <div
                    onClick={handleBackspace}
                    title="Click or backspace to delete last digit"
                    className={cn(
                      "text-right font-light text-white tracking-tight leading-none select-text whitespace-nowrap overflow-hidden transition-all duration-150 cursor-pointer",
                      getDisplayFontSize(formattedDisplay),
                    )}
                  >
                    {formattedDisplay}
                  </div>
                </div>

                {/* Keypad Grid (4 columns x 5 rows) - True Circular Buttons */}
                <div className="w-full grid grid-cols-4 gap-3.5 z-10 shrink-0">
                  {/* Row 1: C/AC, +/-, %, ÷ */}
                  <button
                    type="button"
                    onClick={
                      isInputNonZero ? handleClearCurrent : handleAllClear
                    }
                    className="w-full aspect-square rounded-full bg-[#383D4A] hover:bg-[#434958] active:scale-[0.92] text-white text-[22px] sm:text-[24px] font-normal leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)] cursor-pointer touch-manipulation"
                  >
                    {isInputNonZero ? "C" : "AC"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNegate}
                    className="w-full aspect-square rounded-full bg-[#383D4A] hover:bg-[#434958] active:scale-[0.92] text-white text-[22px] sm:text-[24px] font-normal leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)] cursor-pointer touch-manipulation"
                  >
                    +/−
                  </button>
                  <button
                    type="button"
                    onClick={handlePercentage}
                    className="w-full aspect-square rounded-full bg-[#383D4A] hover:bg-[#434958] active:scale-[0.92] text-white text-[22px] sm:text-[24px] font-normal leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)] cursor-pointer touch-manipulation"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("/")}
                    className="w-full aspect-square rounded-full bg-[#FF9500] hover:bg-[#FFA51E] active:scale-[0.92] text-white text-[30px] sm:text-[32px] font-medium leading-none flex items-center justify-center transition-transform shadow-[0_5px_18px_rgba(255,149,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] cursor-pointer touch-manipulation"
                  >
                    ÷
                  </button>

                  {/* Row 2: 7, 8, 9, × */}
                  <button
                    type="button"
                    onClick={() => handleDigit("7")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    7
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit("8")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    8
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit("9")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    9
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("*")}
                    className="w-full aspect-square rounded-full bg-[#FF9500] hover:bg-[#FFA51E] active:scale-[0.92] text-white text-[30px] sm:text-[32px] font-medium leading-none flex items-center justify-center transition-transform shadow-[0_5px_18px_rgba(255,149,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] cursor-pointer touch-manipulation"
                  >
                    ×
                  </button>

                  {/* Row 3: 4, 5, 6, − */}
                  <button
                    type="button"
                    onClick={() => handleDigit("4")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    4
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit("5")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit("6")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("-")}
                    className="w-full aspect-square rounded-full bg-[#FF9500] hover:bg-[#FFA51E] active:scale-[0.92] text-white text-[30px] sm:text-[32px] font-medium leading-none flex items-center justify-center transition-transform shadow-[0_5px_18px_rgba(255,149,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] cursor-pointer touch-manipulation"
                  >
                    −
                  </button>

                  {/* Row 4: 1, 2, 3, + */}
                  <button
                    type="button"
                    onClick={() => handleDigit("1")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit("2")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit("3")}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("+")}
                    className="w-full aspect-square rounded-full bg-[#FF9500] hover:bg-[#FFA51E] active:scale-[0.92] text-white text-[30px] sm:text-[32px] font-medium leading-none flex items-center justify-center transition-transform shadow-[0_5px_18px_rgba(255,149,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] cursor-pointer touch-manipulation"
                  >
                    +
                  </button>

                  {/* Row 5: 0 (wide 2-cols capsule), ., = */}
                  <button
                    type="button"
                    onClick={() => handleDigit("0")}
                    className="col-span-2 rounded-full h-full aspect-[2.15/1] bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.95] text-white/95 text-[30px] sm:text-[32px] font-light leading-none flex items-center justify-start pl-8 transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDecimal}
                    className="w-full aspect-square rounded-full bg-[#22252E] hover:bg-[#2B2F3A] active:scale-[0.92] text-white/95 text-[36px] font-normal leading-none pb-2 flex items-center justify-center transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer touch-manipulation"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={handleEquals}
                    className="w-full aspect-square rounded-full bg-[#FF9500] hover:bg-[#FFA51E] active:scale-[0.92] text-white text-[30px] sm:text-[32px] font-medium leading-none flex items-center justify-center transition-transform shadow-[0_5px_18px_rgba(255,149,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] cursor-pointer touch-manipulation"
                  >
                    =
                  </button>
                </div>
              </motion.div>
            ) : (
              /* History Screen inside the exact same fixed chassis */
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col justify-between flex-1 w-full z-10 h-full min-h-0 pt-1"
              >
                {/* Scrollable History List - Up to 100 items */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5 pb-8 select-none min-h-0">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-28 text-center text-slate-500">
                      <HistoryIcon className="w-10 h-10 mb-2 opacity-25 text-slate-400" />
                      <p className="text-sm font-medium text-slate-400">
                        No History Yet
                      </p>
                      <p className="text-xs text-slate-600 mt-1 max-w-[220px]">
                        Your completed calculations will appear here.
                      </p>
                    </div>
                  ) : (
                    history.slice(0, 100).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistory(item)}
                        title="Click to restore into calculator"
                        className="group py-2.5 px-3 rounded-[16px] hover:bg-white/[0.05] transition-colors cursor-pointer text-right border-b border-white/[0.04] last:border-none"
                      >
                        <div className="text-xs font-mono text-slate-400 truncate mb-1">
                          {item.expression} =
                        </div>
                        <div className="text-[22px] font-light text-white group-hover:text-amber-400 transition-colors font-mono tracking-tight tabular-nums leading-tight">
                          {formatNumber(item.result)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Bar: '<' on far left | History (N) centered | Clear on far right */}
                <div className="pt-3 border-t border-white/[0.08] mt-2 grid grid-cols-3 items-center shrink-0 w-full px-1">
                  {/* Far Left: Back to Keypad '<' Button */}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => setViewMode("keypad")}
                      title="Back to Calculator"
                      aria-label="Back to Calculator"
                      className="w-9 h-9 rounded-full bg-[#252832] hover:bg-[#323644] active:scale-90 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5 shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Centered: History Count */}
                  <div className="flex justify-center text-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold select-none">
                      History ({history.length})
                    </span>
                  </div>

                  {/* Far Right: Clear Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      disabled={history.length === 0}
                      className="text-xs font-mono text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-rose-500/10 active:scale-95"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Emulator Tagline: Centered at bottom, visible in both views */}
        <div className="hidden md:flex items-center justify-center pt-2.5 pb-0.5 select-none pointer-events-none z-10 shrink-0">
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-slate-500 font-medium">
            Calculator
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CalculatorModal;
