"use client";

interface ProctoringOptions {
  onViolation: (type: string, details: unknown) => void;
  testId: string;
  attemptId: string;
}

export default class ProctoringService {
  private options: ProctoringOptions;
  private visibilityHandler: () => void;
  private focusHandler: () => void;
  private blurHandler: () => void;
  private keydownHandler: (e: KeyboardEvent) => void;
  private copyHandler: (e: ClipboardEvent) => void;
  private pasteHandler: (e: ClipboardEvent) => void;
  private contextMenuHandler: (e: MouseEvent) => void;
  private fullscreenChangeHandler: () => void;
  private webcamStream: MediaStream | null = null;
  private webcamInterval: NodeJS.Timeout | null = null;
  private lastActiveTime: number;
  private warningCount = 0;

  constructor(options: ProctoringOptions) {
    this.options = options;
    this.lastActiveTime = Date.now();

    // Initialize event handlers
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    this.focusHandler = this.handleFocus.bind(this);
    this.blurHandler = this.handleBlur.bind(this);
    this.keydownHandler = this.handleKeydown.bind(this);
    this.copyHandler = this.handleCopy.bind(this);
    this.pasteHandler = this.handlePaste.bind(this);
    this.contextMenuHandler = this.handleContextMenu.bind(this);
    this.fullscreenChangeHandler = this.handleFullscreenChange.bind(this);

    // Set up event listeners
    this.setupEventListeners();

    // Initialize webcam monitoring
    void this.initWebcam();

    // Start activity monitoring
    this.startActivityMonitoring();

    console.log("Proctoring service initialized and active");
  }

  private setupEventListeners() {
    document.addEventListener("visibilitychange", this.visibilityHandler);
    window.addEventListener("focus", this.focusHandler);
    window.addEventListener("blur", this.blurHandler);
    document.addEventListener("keydown", this.keydownHandler);
    document.addEventListener("copy", this.copyHandler);
    document.addEventListener("paste", this.pasteHandler);
    document.addEventListener("contextmenu", this.contextMenuHandler);
    document.addEventListener("fullscreenchange", this.fullscreenChangeHandler);
  }

  private removeEventListeners() {
    document.removeEventListener("visibilitychange", this.visibilityHandler);
    window.removeEventListener("focus", this.focusHandler);
    window.removeEventListener("blur", this.blurHandler);
    document.removeEventListener("keydown", this.keydownHandler);
    document.removeEventListener("copy", this.copyHandler);
    document.removeEventListener("paste", this.pasteHandler);
    document.removeEventListener("contextmenu", this.contextMenuHandler);
    document.removeEventListener(
      "fullscreenchange",
      this.fullscreenChangeHandler,
    );
  }

  private handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
      this.reportViolation("tab_switch", { timestamp: Date.now() });
    }
  }

  private handleFocus() {
    this.lastActiveTime = Date.now();
  }

  private handleBlur() {
    this.reportViolation("window_blur", { timestamp: Date.now() });
  }

  private handleKeydown(e: KeyboardEvent) {
    // Detect keyboard shortcuts that might indicate cheating
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "c" ||
        e.key === "v" ||
        e.key === "f" ||
        e.key === "p" ||
        e.key === "s")
    ) {
      e.preventDefault();
      this.reportViolation("keyboard_shortcut", {
        key: e.key,
        timestamp: Date.now(),
      });
    }

    // Detect Alt+Tab
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      this.reportViolation("alt_tab", { timestamp: Date.now() });
    }

    // Detect PrintScreen
    if (e.key === "PrintScreen") {
      e.preventDefault();
      this.reportViolation("print_screen", { timestamp: Date.now() });
    }
  }

  private handleCopy(e: ClipboardEvent) {
    e.preventDefault();
    this.reportViolation("copy", { timestamp: Date.now() });
  }

  private handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    this.reportViolation("paste", { timestamp: Date.now() });
  }

  private handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    this.reportViolation("context_menu", { timestamp: Date.now() });
  }

  private handleFullscreenChange() {
    if (!document.fullscreenElement) {
      this.reportViolation("fullscreen_exit", { timestamp: Date.now() });
    }
  }

  // Update the initWebcam method to handle the case where we already have permission
  private async initWebcam() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      console.error("MediaDevices API not available");
      this.reportViolation("webcam_api_unavailable", { timestamp: Date.now() });
      return;
    }

    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Verify that we actually got video tracks
      if (
        !this.webcamStream ||
        this.webcamStream.getVideoTracks().length === 0
      ) {
        throw new Error("No video tracks available");
      }

      // Set up periodic checks for face detection
      this.webcamInterval = setInterval(() => {
        this.checkWebcamActivity();
      }, 5000);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      this.reportViolation("webcam_access_denied", {
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private checkWebcamActivity() {
    // In a real implementation, this would use face detection
    // to ensure the user is present and looking at the screen
    // For this example, we'll just check if the webcam is still active
    if (
      !this.webcamStream ||
      this.webcamStream.getVideoTracks()[0]!.readyState !== "live"
    ) {
      this.reportViolation("webcam_inactive", { timestamp: Date.now() });
    }
  }

  private startActivityMonitoring() {
    // Check for user inactivity
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastActiveTime > 30000) {
        // 30 seconds of inactivity
        this.reportViolation("inactivity", {
          duration: now - this.lastActiveTime,
          timestamp: now,
        });
        this.lastActiveTime = now; // Reset to prevent multiple reports
      }
    }, 10000);

    // Check for multiple displays
    if (window.screen && "availWidth" in window.screen) {
      // This is a basic check that might indicate multiple monitors
      if (window.screen.availWidth > window.screen.width * 1.5) {
        this.reportViolation("multiple_displays", { timestamp: Date.now() });
      }
    }
  }

  private reportViolation(type: string, details: unknown) {
    // Ensure the service has been running for at least 2 seconds
    // This prevents false positives during initialization
    if (Date.now() - this.lastActiveTime < 2000) {
      console.log("Ignoring violation during initialization:", type);
      return;
    }

    this.warningCount++;

    // Determine severity based on violation type or count
    let severity = "warning";
    if (
      type === "tab_switch" ||
      type === "window_blur" ||
      this.warningCount >= 3
    ) {
      severity = "severe";
    }

    // Call the provided violation handler
    this.options.onViolation(severity, {
      type,
      details,
      testId: this.options.testId,
      attemptId: this.options.attemptId,
    });

    // Log the violation to the server
    void this.logViolation(type, details, severity);
  }

  private async logViolation(type: string, details: unknown, severity: string) {
    console.log(
      `Logging violation: ${type}, details: ${JSON.stringify(
        details,
      )}, severity: ${severity}`,
    );
  }

  public cleanup() {
    if (typeof window === "undefined") return;

    // Remove all event listeners
    this.removeEventListeners();

    // Stop webcam
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach((track) => track.stop());
      this.webcamStream = null;
    }

    // Clear intervals
    if (this.webcamInterval) {
      clearInterval(this.webcamInterval);
      this.webcamInterval = null;
    }
  }
}
