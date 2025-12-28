import type { CallContext, GeneratedCallPrompt } from "@/types/call"

/**
 * Template-based call prompt generator that works without AI
 * This provides a reliable fallback when AI services are unavailable
 */
export function generateTemplateCallPrompt(context: CallContext): GeneratedCallPrompt {
  const { user_profile, contact, call_goal, topic_mode } = context
  
  // Get goal-specific templates
  const goalTemplates = getGoalTemplates(call_goal.type)
  
  // Generate opening line
  const openingLine = generateOpeningLine(user_profile, contact, call_goal, goalTemplates)
  
  // Generate talking points
  const talkingPoints = generateTalkingPoints(user_profile, contact, call_goal, topic_mode, goalTemplates)
  
  // Generate smart questions
  const smartQuestions = generateSmartQuestions(contact, call_goal, topic_mode, goalTemplates)
  
  // Generate objection handling
  const objectionHandling = generateObjectionHandling(call_goal, goalTemplates)
  
  // Generate closing line
  const closingLine = generateClosingLine(call_goal, goalTemplates)
  
  return {
    opening_line: openingLine,
    key_talking_points: talkingPoints,
    smart_questions: smartQuestions,
    objection_handling: objectionHandling,
    closing_line: closingLine
  }
}

interface GoalTemplates {
  opening: string[]
  talkingPoints: string[]
  questions: string[]
  objections: Record<string, string>
  closing: string[]
}

function getGoalTemplates(goalType: string): GoalTemplates {
  const templates: Record<string, GoalTemplates> = {
    networking: {
      opening: [
        "Hi {contactName}, this is {userName} from {userOrg}. I came across your profile and thought we might have some mutual interests in {industry/field}.",
        "Hello {contactName}, {userName} here. I noticed your work at {contactCompany} and wanted to connect about potential collaboration opportunities.",
        "Hi {contactName}, this is {userName}. I'd love to learn more about what you're working on at {contactCompany} and see if there's a way we can help each other."
      ],
      talkingPoints: [
        "Share background about {userOrg} and what we do",
        "Discuss mutual interests and potential collaboration areas",
        "Explore how we can support each other's goals",
        "Identify specific ways to stay connected"
      ],
      questions: [
        "What are you currently working on that you're most excited about?",
        "What challenges are you facing in your role?",
        "How do you see {industry/field} evolving in the next year?",
        "What kind of partnerships or connections would be most valuable for you?",
        "Who else in your network should I know?"
      ],
      objections: {
        "I'm too busy": "I completely understand - everyone's swamped these days. Would 15 minutes work better? Or I can send you a quick email with the key points.",
        "Not interested": "No problem at all. Thanks for your honesty. Is there someone else at {contactCompany} who might be a better fit?",
        "Send me info via email": "Absolutely, I'll send you a brief overview. Would you prefer I follow up in a week or two to discuss?"
      },
      closing: [
        "Thanks so much for your time, {contactName}. I'll send you that information and let's stay in touch. Would you be open to a quick follow-up call next week?",
        "Really appreciate the conversation, {contactName}. I'll connect you with {resource/person} and we can continue this discussion. When would be a good time to reconnect?"
      ]
    },
    partnership: {
      opening: [
        "Hi {contactName}, this is {userName} from {userOrg}. I'm reaching out because I think there might be a great partnership opportunity between {userOrg} and {contactCompany}.",
        "Hello {contactName}, {userName} here. I've been following {contactCompany}'s work and see potential for a strategic partnership that could benefit both of us."
      ],
      talkingPoints: [
        "Explain the partnership opportunity and mutual benefits",
        "Discuss how our organizations complement each other",
        "Explore specific collaboration areas",
        "Address potential concerns and next steps"
      ],
      questions: [
        "What are {contactCompany}'s current strategic priorities?",
        "What partnerships have been most successful for you in the past?",
        "What would an ideal partnership look like for you?",
        "What concerns do you have about new partnerships?",
        "Who else should be involved in this discussion?"
      ],
      objections: {
        "I'm too busy": "I understand you're busy. Could we schedule 20 minutes next week, or would you prefer I send a detailed proposal first?",
        "Not interested": "I appreciate your candor. What would need to change for this to be interesting to you?",
        "Send me info via email": "Perfect, I'll send a comprehensive partnership proposal. When would be a good time to discuss it?"
      },
      closing: [
        "Thanks for exploring this with me, {contactName}. I'll send the partnership proposal and we can schedule a deeper dive. Does next week work for you?",
        "Great conversation, {contactName}. Let's get the right stakeholders involved. I'll send the details and we can set up a formal meeting."
      ]
    },
    fundraising: {
      opening: [
        "Hi {contactName}, this is {userName} from {userOrg}. I'm reaching out because we're raising capital and I thought you might be interested in learning about our opportunity.",
        "Hello {contactName}, {userName} here. We're in the process of fundraising and I'd love to share what we're building at {userOrg}."
      ],
      talkingPoints: [
        "Share the vision and mission of {userOrg}",
        "Discuss the market opportunity and traction",
        "Explain the investment opportunity and terms",
        "Address questions about the business model and growth plans"
      ],
      questions: [
        "What types of investments are you currently considering?",
        "What criteria do you use to evaluate opportunities?",
        "What's your typical investment timeline?",
        "What questions do you have about our business model?",
        "Who else in your network might be interested?"
      ],
      objections: {
        "I'm too busy": "I completely understand. Would a 30-minute pitch deck walkthrough work, or should I send materials first?",
        "Not interested": "No problem. What would make this opportunity more compelling for you?",
        "Send me info via email": "I'll send the pitch deck and financials. When would be a good time to discuss?"
      },
      closing: [
        "Thanks for your time, {contactName}. I'll send the investment materials and we can schedule a deeper dive. When works best for you?",
        "Appreciate the conversation, {contactName}. Let's get the materials to you and set up a follow-up with our team."
      ]
    },
    hiring: {
      opening: [
        "Hi {contactName}, this is {userName} from {userOrg}. I'm reaching out because we're looking for talented people like you to join our team.",
        "Hello {contactName}, {userName} here. I came across your background and think you might be a great fit for an opportunity at {userOrg}."
      ],
      talkingPoints: [
        "Describe the role and why it's exciting",
        "Share what makes {userOrg} a great place to work",
        "Discuss growth opportunities and career path",
        "Address compensation and benefits"
      ],
      questions: [
        "What are you looking for in your next role?",
        "What's most important to you in a company culture?",
        "What would make you consider a new opportunity?",
        "What questions do you have about the role?",
        "When would you be available to start?"
      ],
      objections: {
        "I'm too busy": "I understand. Would a 20-minute call work, or should I send you the job description first?",
        "Not interested": "No problem at all. What would need to change for this to be interesting?",
        "Send me info via email": "I'll send the job description and company overview. When can we discuss?"
      },
      closing: [
        "Thanks for your time, {contactName}. I'll send the job details and we can schedule a proper interview. When works for you?",
        "Great talking with you, {contactName}. Let's get you the full details and set up next steps."
      ]
    },
    product_demo: {
      opening: [
        "Hi {contactName}, this is {userName} from {userOrg}. I'd love to show you what we've built and see if it could help {contactCompany}.",
        "Hello {contactName}, {userName} here. I think our product could solve some challenges you're facing at {contactCompany}."
      ],
      talkingPoints: [
        "Understand their current pain points and challenges",
        "Demonstrate how our product addresses those needs",
        "Show specific features and benefits",
        "Discuss pricing and implementation"
      ],
      questions: [
        "What are your biggest challenges with {related area}?",
        "What tools are you currently using?",
        "What would success look like for you?",
        "What's your decision-making process?",
        "Who else would be involved in evaluating this?"
      ],
      objections: {
        "I'm too busy": "I understand. Would a 15-minute demo work, or should I send a video walkthrough first?",
        "Not interested": "No problem. What would need to change for this to be valuable?",
        "Send me info via email": "I'll send a demo video and case studies. When can we discuss?"
      },
      closing: [
        "Thanks for your time, {contactName}. I'll send the demo materials and we can schedule a live walkthrough. When works best?",
        "Great conversation, {contactName}. Let's get you set up with a trial and schedule the demo."
      ]
    },
    mentorship: {
      opening: [
        "Hi {contactName}, this is {userName}. I've been following your career and would love to learn from your experience.",
        "Hello {contactName}, {userName} here. I'm reaching out because I'd value your mentorship and guidance."
      ],
      talkingPoints: [
        "Share your background and goals",
        "Discuss specific areas where you'd like guidance",
        "Explore how they can help",
        "Establish a mentorship structure"
      ],
      questions: [
        "What advice would you give to someone in my position?",
        "What mistakes should I avoid?",
        "What resources or connections would be most helpful?",
        "How do you approach {specific challenge}?",
        "Would you be open to an ongoing mentorship relationship?"
      ],
      objections: {
        "I'm too busy": "I completely understand. Would a one-time 30-minute call work, or should I send you my questions first?",
        "Not interested": "No problem at all. Thanks for your honesty.",
        "Send me info via email": "I'll send you my background and specific questions. When could we connect?"
      },
      closing: [
        "Thanks so much for your time and wisdom, {contactName}. I'll send you my questions and we can schedule a follow-up. I really appreciate this.",
        "Really appreciate the conversation, {contactName}. Let's stay in touch and I'll keep you updated on my progress."
      ]
    },
    general: {
      opening: [
        "Hi {contactName}, this is {userName} from {userOrg}. I wanted to reach out and connect.",
        "Hello {contactName}, {userName} here. I'd love to chat and see how we might be able to help each other."
      ],
      talkingPoints: [
        "Build rapport and establish connection",
        "Share relevant information about {userOrg}",
        "Learn about {contactName} and {contactCompany}",
        "Identify mutual interests and opportunities"
      ],
      questions: [
        "What are you working on that's most exciting right now?",
        "What challenges are you facing?",
        "How can I help you achieve your goals?",
        "What would be most valuable for you from this connection?",
        "Who else should I know in your network?"
      ],
      objections: {
        "I'm too busy": "I understand you're busy. Would a quick 15-minute call work, or should I send you an email instead?",
        "Not interested": "No problem at all. Thanks for your time.",
        "Send me info via email": "I'll send you an email with the details. When would be a good time to follow up?"
      },
      closing: [
        "Thanks for your time, {contactName}. Let's stay in touch and I'll send you that information.",
        "Great talking with you, {contactName}. I'll follow up via email and we can continue the conversation."
      ]
    }
  }
  
  return templates[goalType] || templates.general
}

function generateOpeningLine(
  userProfile: CallContext['user_profile'],
  contact: CallContext['contact'],
  callGoal: CallContext['call_goal'],
  templates: GoalTemplates
): string {
  const template = templates.opening[Math.floor(Math.random() * templates.opening.length)]
  
  return template
    .replace(/{contactName}/g, contact.name)
    .replace(/{userName}/g, userProfile.name)
    .replace(/{userOrg}/g, userProfile.organization || "my organization")
    .replace(/{contactCompany}/g, contact.company || "your company")
    .replace(/{industry\/field}/g, "your industry")
}

function generateTalkingPoints(
  userProfile: CallContext['user_profile'],
  contact: CallContext['contact'],
  callGoal: CallContext['call_goal'],
  topicMode: CallContext['topic_mode'],
  templates: GoalTemplates
): string[] {
  let points = [...templates.talkingPoints]
  
  // Add topic mode specific points
  if (topicMode?.topic) {
    points.push(`Focus on ${topicMode.topic}`)
  }
  
  // Add must mention items
  if (topicMode?.must_mention && topicMode.must_mention.length > 0) {
    points.push(`Make sure to mention: ${topicMode.must_mention.join(", ")}`)
  }
  
  // Add desired outcome as a talking point
  if (callGoal.desired_outcome) {
    points.push(`Work towards: ${callGoal.desired_outcome}`)
  }
  
  // Replace placeholders
  return points.map(point => 
    point
      .replace(/{userOrg}/g, userProfile.organization || "our organization")
      .replace(/{contactCompany}/g, contact.company || "their company")
      .replace(/{industry\/field}/g, "the industry")
  )
}

function generateSmartQuestions(
  contact: CallContext['contact'],
  callGoal: CallContext['call_goal'],
  topicMode: CallContext['topic_mode'],
  templates: GoalTemplates
): string[] {
  let questions = [...templates.questions]
  
  // Add priority questions from call goal
  if (callGoal.priority_questions && callGoal.priority_questions.length > 0) {
    questions = [...callGoal.priority_questions, ...questions]
  }
  
  // Add topic mode specific questions
  if (topicMode?.topic) {
    questions.push(`How does ${topicMode.topic} relate to your current priorities?`)
  }
  
  // Replace placeholders
  return questions
    .slice(0, 5) // Limit to 5 questions
    .map(q => 
      q.replace(/{contactCompany}/g, contact.company || "your company")
       .replace(/{related area}/g, topicMode?.topic || "this area")
    )
}

function generateObjectionHandling(
  callGoal: CallContext['call_goal'],
  templates: GoalTemplates
): Array<{ objection: string; reply: string }> {
  return Object.entries(templates.objections).map(([objection, replyTemplate]) => ({
    objection,
    reply: replyTemplate
      .replace(/{contactCompany}/g, "their company")
  }))
}

function generateClosingLine(
  callGoal: CallContext['call_goal'],
  templates: GoalTemplates
): string {
  const template = templates.closing[Math.floor(Math.random() * templates.closing.length)]
  
  return template
    .replace(/{contactName}/g, "the contact")
    .replace(/{resource\/person}/g, "relevant resources")
}
