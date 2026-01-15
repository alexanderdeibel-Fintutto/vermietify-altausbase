import React from 'react';
import AICommunicationHub from './AICommunicationHub';

// Index page redirects to AICommunicationHub - ensures AICommunicationHub is the default landing page
export default function Index() {
  return <AICommunicationHub />;
}