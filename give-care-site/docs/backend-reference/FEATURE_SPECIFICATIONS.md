# GiveCare Feature Specifications

## 🧠 **Comprehensive Profile Collection System**

### **Overview**
Empathetic, purpose-driven profile collection that gathers ALL essential information while explaining how each field helps provide better care support. No field is optional - complete profiles enable deeply personalized caregiving assistance.

### **Core Principles**
- **Empathetic Collection**: Explain WHY each field helps provide better support
- **Value-First**: Help with immediate needs while collecting information
- **Purpose-Driven**: Connect every question to improved care outcomes
- **Complete Profiles**: ALL 13 fields required for full personalization

### **Required Fields (13 Total)**
```python
# User Profile (7 fields)
ALL_USER_FIELDS = [
    "name",           # "What's your first name? This helps me personalize my advice."
    "email",          # "What email works best for sending you care resources?"
    "location",       # "What city are you in? This helps me find local support services."
    "age",            # "May I ask your age? This helps me understand your energy levels."
    "family_members", # "Do you have family members who help? Understanding your support network helps."
    "energy_level",   # "How are your energy levels (1-10)? This helps me gauge what advice fits."
    "notes"          # "Is there anything else about your situation I should know?"
]

# Care Recipient Profile (6 fields)  
ALL_RECIPIENT_FIELDS = [
    "name",              # "What's your loved one's name? I'll remember this for future conversations."
    "relationship",      # "What's your relationship to them? This helps me understand family dynamics."
    "age",              # "How old is your loved one?"
    "medical_conditions", # "What health conditions should I know about? This helps me give relevant advice."
    "location",         # "Does your loved one live in the same area as you, or somewhere else?"
    "notes"            # Care-specific notes and important details
]
```

### **Natural Conversation Flow**
```
User: "My mom is having trouble sleeping"
Agent: "I'm sorry to hear your mom is struggling with sleep. Sleep issues are really common with aging. 

To give you the most helpful advice, what's your first name so I can address you properly? This helps me personalize my guidance."

User: "I'm Maria"
Agent: "Thanks Maria! For sleep issues in older adults, there are several gentle approaches we can try...

What city are you in? This helps me find local sleep specialists or support groups if needed."
```

### **Progress Tracking & Motivation**
- **Completion Score**: "Profile: 8/13 fields (61.5%)" 
- **Next Question Prompting**: System generates next most important question
- **Purpose Connection**: Every question explains its care benefit
- **Completion Celebration**: "🎉 Complete profile! All 13 fields filled - I can now provide the most personalized care support."

### **Technical Implementation**
- **Storage**: All fields in users and care_recipients tables with validation
- **Logic**: `utils/profile_manager.py` contains comprehensive collection logic
- **Agent Integration**: Profile extraction uses structured outputs with gpt-4.1-nano-prod
- **Completion Tracking**: Only marks onboarding complete when ALL fields filled

---

## 💬 **Conversation Engine**

### **Overview**
Contextual, empathetic conversation system that maintains state across interactions and adapts to user communication style.

### **Core Capabilities**
- **Context Continuity**: Remember previous conversations and topics
- **Emotional Intelligence**: Recognize stress, urgency, and emotional state
- **Topic Switching**: Handle natural conversation flow changes
- **Personalization**: Adapt tone and content to user preferences

### **Conversation States**
```python
class ConversationState:
    DISCOVERY = "discovery"          # Learning about user's situation
    PROBLEM_SOLVING = "solving"      # Addressing specific issues
    PROFILING = "profiling"          # Collecting additional information
    CRISIS = "crisis"                # Emergency or urgent situations
    MAINTENANCE = "maintenance"      # Ongoing support and check-ins
```

### **Context Management**
- **Session Memory**: Current conversation context and topics
- **User Memory**: Persistent preferences and situation details
- **Conversation History**: Previous interactions for continuity
- **Relationship Memory**: Details about care recipients and family

### **Response Patterns**
```
Empathetic Opening: "That sounds really challenging..."
Information Gathering: "To help you better, can you tell me..."
Solution Delivery: "Here are some options that might help..."
Follow-up Planning: "Let's check back on this in a few days..."
```

---

## 🚨 **Crisis Detection System**

### **Overview**
Real-time safety assessment system that identifies emergencies and provides immediate resources while escalating appropriately.

### **Detection Triggers**
```python
CRISIS_KEYWORDS = {
    "immediate": ["emergency", "911", "urgent", "falling", "hurt", "bleeding"],
    "medical": ["chest pain", "difficulty breathing", "unconscious", "seizure"],
    "mental_health": ["suicide", "harm", "dangerous", "scared for safety"],
    "abuse": ["hitting", "abuse", "neglect", "unsafe", "threatened"]
}
```

### **Response Protocol**
1. **Immediate Assessment**: Classify crisis type and severity
2. **Safety Resources**: Provide relevant emergency contacts
3. **Professional Referral**: Recommend appropriate professional help
4. **Documentation**: Log interaction for review and follow-up
5. **Escalation**: Optional human review for high-severity cases

### **Crisis Response Examples**
```
User: "Mom fell and won't get up"
System: "This sounds urgent. Have you called 911? If she's injured or in pain, 
please call emergency services immediately. I'm here to help with next steps 
once you know she's safe."

User: "I can't take this anymore"
System: "I hear how overwhelmed you are. Caregiving is incredibly difficult. 
If you're having thoughts of harm, please reach out to the crisis text line 
(text HOME to 741741) or call 988. You don't have to go through this alone."
```

### **Safety Guardrails**
- **Medical Disclaimer**: Clear boundaries on medical advice scope
- **Professional Referrals**: Appropriate escalation for complex needs
- **Emergency Protocols**: Always prioritize immediate safety
- **Documentation**: Audit trail for all safety-related interactions

---

## 📍 **Local Resource Matching**

### **Overview**
Location-aware resource recommendation system connecting caregivers with relevant local services, facilities, and support options.

### **Resource Categories**
- **Emergency Services**: Hospitals, urgent care, emergency contacts
- **Care Facilities**: Adult day programs, nursing homes, assisted living
- **Home Services**: Home health aides, meal delivery, transportation
- **Support Groups**: Local caregiver meetups, online communities
- **Professional Services**: Elder law attorneys, geriatricians, social workers

### **Matching Algorithm**
1. **Location Extraction**: From user profile or conversation context
2. **Need Assessment**: Based on care recipient conditions and user questions
3. **Resource Filtering**: Match services to specific requirements
4. **Personalized Ranking**: Consider user preferences and past interactions
5. **Actionable Delivery**: Provide contact info and next steps

### **Implementation**
```python
async def get_local_resources(location: str, need_type: str, filters: dict):
    # Geocode location to standardized format
    coordinates = await geocode_location(location)
    
    # Query resource database with proximity search
    resources = await search_resources(
        coordinates=coordinates,
        category=need_type,
        radius_miles=25,
        filters=filters
    )
    
    # Rank by relevance and quality metrics
    return rank_resources(resources, user_preferences)
```

---

## 📋 **Subscription Model**

### **Subscription-First Approach**
GiveCare operates as a premium subscription service to ensure quality support and sustainable operations.

### **Subscription Required ($19.99/month)**
- **24/7 AI Caregiving Assistant**: Unlimited personalized support
- **Crisis Detection & Emergency Response**: Real-time safety monitoring
- **Progressive Profiling**: Natural conversation-driven personalization
- **Local Resource Matching**: Comprehensive facility and service recommendations
- **Condition-Specific Guidance**: Tailored advice for specific medical conditions
- **Family Coordination Support**: Help managing care with multiple family members
- **Professional Referrals**: Vetted provider recommendations

### **Value Proposition**
- **Immediate Access**: Full feature set available upon subscription
- **No Usage Limits**: Unlimited SMS conversations and support
- **Personalized Experience**: Advanced profiling and memory for contextual help
- **Quality Assurance**: Subscription model ensures dedicated support resources

### **Trial Experience**
New users receive informative welcome messages explaining the service value before subscribing:
- First interaction: Full feature overview and subscription link
- Second interaction: Acknowledgment of interest with subscription reminder
- Subsequent interactions: Gentle subscription prompts

---

## 🔄 **Conversation Flow Management**

### **State Transitions**
```
Discovery → Problem Solving → Solution Delivery → Follow-up
     ↓            ↓               ↓              ↓
Profiling ←→ Crisis Mode ←→ Escalation ←→ Maintenance
```

### **Context Switching**
- **Topic Changes**: Natural flow between different caregiving topics
- **Urgency Handling**: Immediate pivot to crisis mode when needed
- **Profiling Integration**: Seamless data collection within help delivery
- **Session Continuity**: Maintain thread across multiple interactions

### **Memory Integration**
- **Short-term**: Current conversation topics and immediate context
- **Medium-term**: Recent interactions and ongoing situations
- **Long-term**: User preferences, care recipient details, successful strategies

---

## 📱 **SMS Experience Optimization**

### **Message Formatting**
- **Concise Responses**: Optimal for SMS character limits
- **Clear Structure**: Numbered lists and bullet points
- **Actionable Content**: Specific next steps and resources
- **Emotional Tone**: Warm, supportive, non-judgmental

### **Conversation Pacing**
- **Response Timing**: Immediate for urgent, thoughtful for complex
- **Message Length**: 1-3 SMS messages per response
- **Follow-up Scheduling**: Smart timing for check-ins
- **User Control**: Easy opt-out and preference management

### **Technical Considerations**
- **Delivery Confirmation**: Ensure message receipt
- **Character Limits**: Graceful handling of long responses
- **Special Characters**: Proper encoding and emoji support
- **Rate Limiting**: Prevent spam and respect user preferences

---

## 📚 **Related Documentation**
- **[PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md)** - Strategic rationale for features
- **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** - Technical implementation details
- **[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)** - Development standards for features
- **[TASKS.md](TASKS.md)** - Active feature development work

*Features designed for real human needs, delivered through technology that feels caring and intelligent.*