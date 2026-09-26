import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import CallRecordingModal from 'c/callRecordingModal';

const O = 'Contact_Center_Call__c';
const FIELDS = [
    'Name', 'Status__c', 'Call_Received__c', 'Agent_Connected__c', 'Call_Ended__c', 'Queue__c', 'Agent__c',
    'Customer_Sentiment__c', 'Caller_Phone__c', 'Talk_Time_Seconds__c', 'Wait_Time_Seconds__c',
    'Total_Duration_Seconds__c', 'Virtual_Agent_Seconds__c', 'Recording_Url__c', 'Handled_By_Virtual_Agent__c',
    'Quality_Score__c', 'Quality_Plan__c', 'Quality_Summary__c', 'Quality_Action_Plan__c', 'Quality_Evaluation_Json__c', 'Quality_Evaluated_At__c'
].map((f) => `${O}.${f}`);
const LIVE_POLL_MS = 15000;

const SENTIMENT = {
    Positive: ['😊', 'good'], 'Slightly positive': ['🙂', 'good'], Neutral: ['😐', 'neutral'],
    'Slightly negative': ['🙁', 'bad'], Negative: ['😟', 'bad']
};

const secs = (n) => {
    if (n === null || n === undefined || n === '') return null;
    const v = Math.round(Number(n));
    return v < 60 ? `${v}s` : `${Math.floor(v / 60)}m ${String(v % 60).padStart(2, '0')}s`;
};
const time = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');

// D365 Quality Evaluation bands: >= 71 Good, >= 41 Fair, else Poor.
const scoreBand = (s) => (s >= 71 ? ['Good', 'good', '#2e844a'] : s >= 41 ? ['Fair', 'fair', '#d97706'] : ['Poor', 'poor', '#ba0517']);
const BAND_CLASS = { Normal: 'good', Warning: 'fair', Critical: 'poor' };

function parseQuality(v) {
    const score = v('Quality_Score__c');
    if (score === null || score === undefined) return null;
    const [label, tone, color] = scoreBand(score);
    let indicators = [];
    try {
        const j = JSON.parse(v('Quality_Evaluation_Json__c') || '{}');
        indicators = ((j.evaluation_result && j.evaluation_result.responses) || []).map((r, i) => {
            const q = (r.questionInfo && r.questionInfo[0]) || {};
            const t = BAND_CLASS[r.matchedBandLabel] || scoreBand(r.monitorScore)[1];
            return {
                key: r.monitorId || String(i),
                name: r.monitorName,
                score: r.monitorScore,
                band: r.matchedBandLabel || scoreBand(r.monitorScore)[0],
                pillClass: `ind-pill ind-${t}`,
                barStyle: `width:${Math.max(3, Math.min(100, r.monitorScore))}%`,
                barClass: `ind-bar-fill ind-${t}`,
                question: (q.questionText || '').trim(),
                answer: (q.answerText || '').trim(),
                reason: (q.reason || '').trim()
            };
        });
    } catch (e) {
        indicators = [];
    }
    return {
        score,
        label,
        pillClass: `qa-band qa-${tone}`,
        ringStyle: `background: conic-gradient(${color} ${score * 3.6}deg, #ecebea 0deg)`,
        plan: v('Quality_Plan__c') || 'Quality evaluation',
        evaluatedAt: time(v('Quality_Evaluated_At__c')),
        summary: v('Quality_Summary__c'),
        actionPlan: v('Quality_Action_Plan__c'),
        indicators,
        indicatorCount: indicators.length,
        attention: indicators.filter((x) => x.score < 71).length
    };
}

export default class CallTimeline extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    wired;
    records = [];
    loaded = false;
    timer;

    get relatedListId() {
        return 'Contact_Center_Calls__r';
    }

    // On a Contact Center Call record page the card shows that single call; on a Case/Contact it lists related calls.
    get isCallRecord() {
        return this.objectApiName === O;
    }

    get parentId() {
        return this.isCallRecord ? undefined : this.recordId;
    }

    get callId() {
        return this.isCallRecord ? this.recordId : undefined;
    }

    get cardTitle() {
        if (!this.isCallRecord) return 'Call Timeline';
        return (this.records[0] && this.records[0].fields.Name && this.records[0].fields.Name.value) || 'Call Journey';
    }

    get cardSubtitle() {
        return this.isCallRecord ? 'Call journey · Dynamics 365 Contact Center' : 'Dynamics 365 Contact Center';
    }

    get showCount() {
        return this.hasCalls && !this.isCallRecord;
    }

    get showDetailsLink() {
        return !this.isCallRecord;
    }

    @wire(getRecord, { recordId: '$callId', fields: FIELDS })
    wiredSingle(result) {
        if (!this.isCallRecord) return;
        this.wired = result;
        if (result.data) {
            this.records = [{ id: result.data.id, fields: result.data.fields }];
            this.loaded = true;
            this.schedulePoll();
        } else if (result.error) {
            this.records = [];
            this.loaded = true;
        }
    }

    @wire(getRelatedListRecords, {
        parentRecordId: '$parentId',
        relatedListId: '$relatedListId',
        fields: FIELDS,
        sortBy: [`${O}.Call_Received__c`],
        pageSize: 50
    })
    wiredCalls(result) {
        if (this.isCallRecord) return;
        this.wired = result;
        if (result.data) {
            this.records = result.data.records || [];
            this.loaded = true;
            this.schedulePoll();
        } else if (result.error) {
            this.records = [];
            this.loaded = true;
        }
    }

    disconnectedCallback() {
        clearTimeout(this.timer);
    }

    schedulePoll() {
        clearTimeout(this.timer);
        if (this.records.some((r) => r.fields.Status__c.value !== 'Completed')) {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.timer = setTimeout(() => refreshApex(this.wired), LIVE_POLL_MS);
        }
    }

    handleRefresh() {
        refreshApex(this.wired);
    }

    get hasCalls() {
        return this.calls.length > 0;
    }

    get callCountLabel() {
        const n = this.calls.length;
        return `${n} call${n === 1 ? '' : 's'}`;
    }

    get calls() {
        return [...this.records]
            .map((r) => this.toView(r))
            .sort((a, b) => (b.received || '').localeCompare(a.received || ''));
    }

    toView(r) {
        const v = (f) => r.fields[f] && r.fields[f].value;
        const received = v('Call_Received__c');
        const d = received ? new Date(received) : null;
        const done = v('Status__c') === 'Completed';
        const sentiment = v('Customer_Sentiment__c');
        const [emoji, tone] = SENTIMENT[sentiment] || ['', 'neutral'];
        const agent = v('Agent__c');

        const steps = [
            { key: 'in', icon: 'utility:incoming_call', label: 'Call received', meta: time(received), state: 'done' },
            {
                key: 'va', icon: 'utility:einstein', label: 'Virtual agent',
                meta: secs(v('Virtual_Agent_Seconds__c')) || (done ? '' : 'handled'), state: 'done'
            },
            {
                key: 'q', icon: 'utility:hourglass', label: `${v('Queue__c') || 'Voice'} queue`,
                meta: secs(v('Wait_Time_Seconds__c')) ? `wait ${secs(v('Wait_Time_Seconds__c'))}` : '', state: v('Agent_Connected__c') || done ? 'done' : 'active'
            },
            {
                key: 'ag', icon: 'utility:agent_session', label: agent || 'Agent',
                meta: v('Agent_Connected__c') ? `answered ${time(v('Agent_Connected__c'))}` : done ? '' : 'connecting…',
                state: done ? 'done' : v('Agent_Connected__c') ? 'active' : 'active'
            },
            {
                key: 'end', icon: done ? 'utility:end_call' : 'utility:record', label: done ? 'Call ended' : 'In progress',
                meta: done ? time(v('Call_Ended__c')) : 'live', state: done ? 'done' : 'live'
            }
        ].map((s) => ({ ...s, cls: `step step-${s.state}` }));

        return {
            id: r.id,
            name: v('Name'),
            recordUrl: `/lightning/r/${O}/${r.id}/view`,
            received,
            receivedTs: received ? Date.parse(received) : null,
            month: d ? d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '',
            day: d ? d.getDate() : '',
            weekday: d ? d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '',
            statusLabel: done ? 'Completed' : 'Live',
            statusClass: done ? 'status status-done' : 'status status-live',
            steps,
            total: secs(v('Total_Duration_Seconds__c')) || (done ? '—' : 'live'),
            talk: secs(v('Talk_Time_Seconds__c')),
            sentiment,
            sentimentEmoji: emoji,
            sentimentClass: `chip sentiment sentiment-${tone}`,
            phone: v('Caller_Phone__c'),
            agentName: agent,
            quality: parseQuality(v),
            showQuality: this.isCallRecord && !!parseQuality(v),
            url: v('Recording_Url__c')
        };
    }

    openRecording(event) {
        event.preventDefault();
        const { id, mode } = event.currentTarget.dataset;
        const c = this.calls.find((x) => x.id === id);
        if (!c || !c.url) return;
        const when = c.received
            ? new Date(c.received).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : '';
        CallRecordingModal.open({
            size: 'full',
            url: c.url,
            label: mode === 'transcript' ? 'Call transcript' : 'Call recording',
            subtitle: [when, c.agentName, 'Dynamics 365 Contact Center'].filter(Boolean).join(' · '),
            description: 'Dynamics 365 Contact Center conversation'
        });
    }

    openCall(event) {
        event.preventDefault();
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: event.currentTarget.dataset.id, objectApiName: O, actionName: 'view' }
        });
    }
}