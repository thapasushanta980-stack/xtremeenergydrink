import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** What to show instead. Defaults to nothing: the rest of the page closes up. */
  fallback?: ReactNode;
  /** Named in the console so a failure is traceable to a section. */
  label: string;
}

/**
 * One broken piece must not take the page with it.
 *
 * React unmounts the whole tree when a render throws, so without a boundary a
 * single bad section leaves a blank screen. Each section and each decorative
 * layer gets its own boundary: a failure costs that one piece, and the other
 * sections, the navigation and the footer keep working.
 */
export class Boundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[xtreme] "${this.props.label}" failed and was dropped`, error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback ?? null;
  }
}
