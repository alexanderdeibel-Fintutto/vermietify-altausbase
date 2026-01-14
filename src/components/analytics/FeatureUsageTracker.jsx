import { base44 } from '@/api/base44Client';

export const trackFeatureUsage = {
  // Wizard usage
  wizardOpened: (wizardName) => {
    base44.analytics.track({
      eventName: 'wizard_opened',
      properties: {
        wizard_name: wizardName
      }
    });
  },

  wizardCompleted: (wizardName, duration_ms) => {
    base44.analytics.track({
      eventName: 'wizard_completed',
      properties: {
        wizard_name: wizardName,
        duration_ms: duration_ms
      }
    });
  },

  // Feature interactions
  featureClicked: (featureName, context = {}) => {
    base44.analytics.track({
      eventName: 'feature_clicked',
      properties: {
        feature_name: featureName,
        ...context
      }
    });
  },

  // Document operations
  documentGenerated: (documentType, success = true) => {
    base44.analytics.track({
      eventName: 'document_generated',
      properties: {
        document_type: documentType,
        success: success
      }
    });
  },

  // AI usage
  aiFeatureUsed: (featureName, promptLength = 0) => {
    base44.analytics.track({
      eventName: 'ai_feature_used',
      properties: {
        feature_name: featureName,
        prompt_length: promptLength
      }
    });
  },

  // Bulk operations
  bulkOperationExecuted: (operationType, itemCount, success = true) => {
    base44.analytics.track({
      eventName: 'bulk_operation_executed',
      properties: {
        operation_type: operationType,
        item_count: itemCount,
        success: success
      }
    });
  },

  // Navigation
  pageViewed: (pageName, timeSpent_ms = 0) => {
    base44.analytics.track({
      eventName: 'page_viewed',
      properties: {
        page_name: pageName,
        time_spent_ms: timeSpent_ms
      }
    });
  },

  // Search
  searchPerformed: (searchTerm, resultCount) => {
    base44.analytics.track({
      eventName: 'search_performed',
      properties: {
        search_term_length: searchTerm?.length || 0,
        result_count: resultCount
      }
    });
  },

  // Export/Import
  dataExported: (entityType, format, recordCount) => {
    base44.analytics.track({
      eventName: 'data_exported',
      properties: {
        entity_type: entityType,
        format: format,
        record_count: recordCount
      }
    });
  },

  dataImported: (entityType, recordCount, success = true) => {
    base44.analytics.track({
      eventName: 'data_imported',
      properties: {
        entity_type: entityType,
        record_count: recordCount,
        success: success
      }
    });
  }
};

export function usePageViewTracking(pageName) {
  const [enterTime, setEnterTime] = React.useState(null);

  React.useEffect(() => {
    const startTime = Date.now();
    setEnterTime(startTime);

    trackFeatureUsage.pageViewed(pageName, 0);

    return () => {
      const timeSpent = Date.now() - startTime;
      trackFeatureUsage.pageViewed(pageName, timeSpent);
    };
  }, [pageName]);
}