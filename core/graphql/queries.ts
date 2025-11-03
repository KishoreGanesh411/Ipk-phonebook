import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query MeProfile {
    me {
      id
      name
      email
      phone
      gender
      role
    }
  }
`;

export const STAGE_SUMMARY_QUERY = gql`
  query StageSummary {
    leadStageSummary {
      total
      items { stage count }
    }
  }
`;

export const LEADS_BY_STAGE_QUERY = gql`
  query LeadsByStage($stage: ClientStage, $args: LeadListArgs) {
    leadsByStage(stage: $stage, args: $args) {
      page
      pageSize
      total
      items {
        id
        name
        phone
        clientStage
        leadSource
        assignedRM
        assignedRmId
        status
        leadCode
        nextActionDueAt
        lastContactedAt
        investmentRange
        sipAmount
        product
      }
    }
  }
`;

export const LEAD_DETAIL_WITH_TIMELINE = gql`
  query LeadDetailWithTimeline($leadId: ID!, $eventsLimit: Int = 20) {
    leadDetailWithTimeline(leadId: $leadId, eventsLimit: $eventsLimit) {
      id
      leadCode
      status
      clientStage
      name
      firstName
      lastName
      phone
      assignedRM
      assignedRmId
      lastContactedAt
      phones { id number normalized isPrimary isWhatsapp label }
      email
      location
      age
      gender
      product
      investmentRange
      sipAmount
      leadSource
      referralName
      remark
      bioText
      clientQa { question answer }
      nextActionDueAt
      createdAt
      updatedAt
      accountApps: accountApplicationsByLead {
        id
        applicationStatus
        kycStatus
        submittedAt
        reviewedAt
        approvedAt
        declinedAt
      }
      events {
        id
        type
        text
        occurredAt
        tags
      }
    }
  }
`;

