import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './Icons';

export class ApplicationErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Binary phase lab failed', error, info); }
  render() {
    if (this.state.hasError) {
      return <main className="app-error-state"><Icon name="info"/><h1>实验室加载失败</h1><p>请刷新页面重新载入相图数据。</p><button type="button" onClick={() => window.location.reload()}><Icon name="reset"/>刷新页面</button></main>;
    }
    return this.props.children;
  }
}
