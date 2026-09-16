from pathlib import Path
from xml.sax.saxutils import escape

out = Path('/home/user/abhijeet-varghese-website/abhijeetvarghese/assets')
out.mkdir(exist_ok=True)

# A small self-contained SVG system: each diagram is legible as an independent
# asset and has its own title/description for non-visual readers.
BASE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title><desc id="desc">{desc}</desc>
  <defs>
    <style>
      .bg{{fill:{bg}}}.line{{stroke:{line};stroke-width:1.4;fill:none}}.line2{{stroke:{accent};stroke-width:2.2;fill:none}}.dash{{stroke:{line};stroke-width:1.4;fill:none;stroke-dasharray:5 7}}.panel{{fill:{panel};stroke:{line};stroke-width:1.3}}.panel2{{fill:{accent_pale};stroke:{accent};stroke-width:1.3}}.dark{{fill:{dark}}}.accent{{fill:{accent}}}.warm{{fill:{warm}}}.text{{fill:{text};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;letter-spacing:1.3px}}.label{{fill:{muted};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px}}.small{{fill:{muted};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:500}}.white{{fill:#F8F3EB;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;letter-spacing:1.3px}}.num{{fill:{accent};font-family:Georgia,serif;font-size:31px;font-style:italic}}
    </style>
    <linearGradient id="soft" x1="0" x2="1"><stop stop-color="{accent}" stop-opacity=".16"/><stop offset="1" stop-color="{accent}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect class="bg" width="1200" height="720"/>
  {body}
</svg>'''

C = dict(bg='#F4F0E8', panel='#FCFAF5', dark='#0B1428', text='#0C1830', muted='#5E6571', line='#C9C4BA', accent='#A8442F', accent_pale='#F1DDD6', warm='#C98B42')

def svg(name, title, desc, body, **overrides):
    c=C.copy();c.update(overrides)
    (out/name).write_text(BASE.format(title=escape(title), desc=escape(desc), body=body, **c), encoding='utf-8')

svg('enterprise-experience-fragmentation-gap.svg', 'The Experience Fragmentation Gap', 'Marketing, IT, Sales, HR, Operations and Innovation are separate organisational systems. Their lines converge into one human journey.', '''
<text x="72" y="72" class="label">INSIDE THE ORGANISATION</text><text x="72" y="102" class="small">Separate owners make separate touchpoints.</text>
<g>
 <rect class="panel" x="72" y="166" width="154" height="74" rx="2"/><text x="93" y="210" class="text">MARKETING</text>
 <rect class="panel" x="276" y="166" width="110" height="74" rx="2"/><text x="304" y="210" class="text">IT</text>
 <rect class="panel" x="436" y="166" width="130" height="74" rx="2"/><text x="462" y="210" class="text">SALES</text>
 <rect class="panel" x="616" y="166" width="110" height="74" rx="2"/><text x="646" y="210" class="text">HR</text>
 <rect class="panel" x="776" y="166" width="156" height="74" rx="2"/><text x="801" y="210" class="text">OPERATIONS</text>
 <rect class="panel" x="982" y="166" width="146" height="74" rx="2"/><text x="1003" y="210" class="text">INNOVATION</text>
</g>
<g class="dash"><path d="M149 240V358"/><path d="M331 240V358"/><path d="M501 240V358"/><path d="M671 240V358"/><path d="M854 240V358"/><path d="M1055 240V358"/></g>
<text x="72" y="435" class="label">OUTSIDE THE ORGANISATION</text><path class="line2" d="M72 502H1128"/><circle class="accent" cx="152" cy="502" r="9"/><circle class="accent" cx="364" cy="502" r="9"/><circle class="accent" cx="598" cy="502" r="9"/><circle class="accent" cx="838" cy="502" r="9"/><circle class="accent" cx="1052" cy="502" r="9"/>
<rect class="dark" x="336" y="563" width="528" height="80" rx="40"/><text x="459" y="612" class="white">ONE HUMAN JOURNEY</text>
<path class="line2" d="M600 511v39"/><text x="72" y="679" class="small">Organisations are structured around departments. People experience the organisation as one journey.</text>''')

svg('enterprise-experience-translation-layer.svg', 'The Enterprise Translation Layer', 'Business intent is translated through human need and experience before design, technology and execution.', '''
<text x="72" y="72" class="label">THE ENTERPRISE TRANSLATION LAYER</text><text x="72" y="102" class="small">The bridge between organisational ambition and human experience.</text>
<path class="line" d="M114 359H1086"/><g>
<rect class="panel" x="72" y="280" width="150" height="158" rx="3"/><text x="95" y="338" class="label">BUSINESS</text><text x="95" y="362" class="label">INTENT</text>
<rect class="panel2" x="268" y="248" width="172" height="222" rx="3"/><text x="301" y="330" class="label">HUMAN</text><text x="301" y="354" class="label">NEED</text><text x="301" y="410" class="small">The critical</text><text x="301" y="429" class="small">translation</text>
<rect class="dark" x="486" y="218" width="228" height="282" rx="3"/><text x="547" y="336" class="white">EXPERIENCE</text><text x="531" y="375" fill="#D8B4A9" font-family="Georgia,serif" font-size="28" font-style="italic">the bridge</text>
<rect class="panel2" x="760" y="248" width="172" height="222" rx="3"/><text x="806" y="342" class="label">DESIGN</text><text x="789" y="380" class="small">feel + behaviour</text>
<rect class="panel" x="978" y="280" width="150" height="158" rx="3"/><text x="997" y="338" class="label">TECHNOLOGY</text><text x="1014" y="376" class="small">enables it</text>
</g>
<g fill="none" stroke="#A8442F" stroke-width="2.2"><path d="M222 359h33m-14-12 14 12-14 12"/><path d="M440 359h33m-14-12 14 12-14 12"/><path d="M714 359h33m-14-12 14 12-14 12"/><path d="M932 359h33m-14-12 14 12-14 12"/></g>
<text x="72" y="630" class="num">01</text><text x="123" y="625" class="text">BUSINESS INTENT</text><text x="294" y="625" class="text">→ HUMAN NEED</text><text x="504" y="625" class="text">→ EXPERIENCE</text><text x="718" y="625" class="text">→ DESIGN + TECHNOLOGY</text>''')

svg('enterprise-touchpoints-vs-journey.svg', 'Touchpoints versus Journey Thinking', 'Disparate touchpoints are shown alongside a continuous journey from need to relationship.', '''
<text x="72" y="72" class="label">TOUCHPOINTS ARE COMPONENTS. A JOURNEY IS THE EXPERIENCE.</text>
<line class="line" x1="602" y1="130" x2="602" y2="650"/>
<text x="72" y="142" class="label">TOUCHPOINT THINKING</text><text x="678" y="142" class="label">JOURNEY THINKING</text>
<g><rect class="panel" x="72" y="194" width="192" height="54"/><text x="96" y="228" class="text">WEBSITE</text><rect class="panel" x="316" y="246" width="192" height="54"/><text x="354" y="280" class="text">APP</text><rect class="panel" x="122" y="344" width="192" height="54"/><text x="166" y="378" class="text">EMAIL</text><rect class="panel" x="328" y="446" width="192" height="54"/><text x="375" y="480" class="text">EVENT</text><rect class="panel" x="76" y="532" width="192" height="54"/><text x="105" y="566" class="text">SHOWROOM</text></g>
<g class="dash"><path d="M264 221l52 52"/><path d="M314 371l14-71"/><path d="M314 371l14 75"/><path d="M268 559l60-59"/></g>
<path d="M680 414C739 414 747 249 818 249s76 260 151 260 79-182 156-182" fill="none" stroke="#A8442F" stroke-width="5" stroke-linecap="round"/>
<g><circle class="dark" cx="680" cy="414" r="27"/><text x="662" y="419" class="white">01</text><circle class="dark" cx="818" cy="249" r="27"/><text x="800" y="254" class="white">02</text><circle class="dark" cx="969" cy="509" r="27"/><text x="951" y="514" class="white">03</text><circle class="dark" cx="1125" cy="327" r="27"/><text x="1107" y="332" class="white">04</text></g>
<text x="644" y="474" class="text">NEED</text><text x="758" y="202" class="text">DISCOVERY</text><text x="908" y="568" class="text">DECISION</text><text x="1068" y="280" class="text">RELATIONSHIP</text>
<text x="72" y="650" class="small">The touchpoints become supporting components of the journey, not the journey itself.</text>''')

svg('enterprise-experience-decision-triangle.svg', 'The Enterprise Decision Triangle', 'Business, Human and Technology form three connected points with Experience at their centre.', '''
<text x="72" y="72" class="label">THE ENTERPRISE DECISION TRIANGLE</text><text x="72" y="102" class="small">A coherent experience is where three forms of value meet.</text>
<path d="M600 164L956 565H244Z" fill="#FCFAF5" stroke="#C9C4BA" stroke-width="1.4"/>
<path d="M600 164L600 399M244 565L600 399 956 565" fill="none" stroke="#A8442F" stroke-width="1.4" stroke-dasharray="5 8"/>
<circle class="dark" cx="600" cy="164" r="82"/><text x="554" y="158" class="white">BUSINESS</text><text x="557" y="184" fill="#C7D0E0" font-family="Arial" font-size="13">value · risk</text>
<circle class="dark" cx="244" cy="565" r="82"/><text x="201" y="560" class="white">HUMAN</text><text x="184" y="586" fill="#C7D0E0" font-family="Arial" font-size="13">need · behaviour</text>
<circle class="dark" cx="956" cy="565" r="82"/><text x="898" y="560" class="white">TECHNOLOGY</text><text x="904" y="586" fill="#C7D0E0" font-family="Arial" font-size="13">capability · data</text>
<circle class="accent" cx="600" cy="399" r="112"/><text x="531" y="406" class="white">EXPERIENCE</text><text x="531" y="438" fill="#F8E9E5" font-family="Georgia,serif" font-size="25" font-style="italic">coherence</text>
<text x="72" y="670" class="small">If one force dominates, the experience becomes transactional, demonstrative or disconnected.</text>''')

svg('hidden-complexity-visible-simplicity.svg', 'Hidden Complexity and Visible Simplicity', 'A three-layer model shows enterprise technology and operations beneath an experience layer, producing a simple, relevant, clear and meaningful experience.', '''
<text x="72" y="72" class="label">THE COMPLEXITY SHOULD STAY BEHIND THE EXPERIENCE</text>
<g><rect class="dark" x="72" y="136" width="1056" height="260" rx="4"/><text x="108" y="178" fill="#D8B4A9" font-family="Arial" font-size="11" font-weight="700" letter-spacing="2">BEHIND THE EXPERIENCE</text>
<g fill="none" stroke="#76839C" stroke-width="1.2"><path d="M148 263H1052M148 324H1052M248 210v133M438 210v133M638 210v133M838 210v133"/></g>
<text x="125" y="252" class="white">DATA</text><text x="276" y="311" class="white">SYSTEMS</text><text x="463" y="252" class="white">VENDORS</text><text x="663" y="311" class="white">INFRASTRUCTURE</text><text x="890" y="252" class="white">OPERATIONS</text></g>
<path d="M600 396v44" stroke="#A8442F" stroke-width="2.2"/><path d="M588 428l12 12 12-12" fill="none" stroke="#A8442F" stroke-width="2.2"/>
<rect class="panel2" x="254" y="452" width="692" height="88" rx="3"/><text x="471" y="506" class="text">EXPERIENCE LAYER</text><text x="703" y="506" class="small">story · hierarchy · interaction</text>
<path d="M600 540v40" stroke="#A8442F" stroke-width="2.2"/><path d="M588 568l12 12 12-12" fill="none" stroke="#A8442F" stroke-width="2.2"/>
<rect class="panel" x="72" y="592" width="1056" height="72" rx="36"/><text x="167" y="637" class="text">SIMPLE</text><text x="404" y="637" class="text">RELEVANT</text><text x="661" y="637" class="text">CLEAR</text><text x="880" y="637" class="text">MEANINGFUL</text>''')

svg('enterprise-approval-room-vs-experience.svg', 'Approval Room versus Experience', 'Approval concerns of features, budget, compliance, brand and feasibility are contrasted with the user experience needs of clarity, context, ease, confidence, relevance and meaning.', '''
<text x="72" y="72" class="label">THE APPROVAL ROOM AND THE EXPERIENCE ANSWER DIFFERENT QUESTIONS</text>
<rect class="dark" x="72" y="136" width="488" height="460" rx="4"/><rect class="panel" x="640" y="136" width="488" height="460" rx="4"/>
<text x="110" y="191" class="label" fill="#D8B4A9">APPROVAL ROOM</text><text x="110" y="236" class="white">What does the</text><text x="110" y="265" class="white">organisation need to see?</text>
<g fill="#C7D0E0" font-family="Arial" font-size="16"><text x="110" y="345">Features</text><text x="110" y="390">Compliance</text><text x="110" y="435">Brand</text><text x="110" y="480">Budget</text><text x="110" y="525">Technical feasibility</text></g>
<text x="680" y="191" class="label">THE EXPERIENCE</text><text x="680" y="236" class="text">What does the person</text><text x="680" y="265" class="text">need to understand?</text>
<g fill="#0C1830" font-family="Arial" font-size="16"><text x="680" y="345">Clarity</text><text x="680" y="390">Context</text><text x="680" y="435">Ease</text><text x="680" y="480">Confidence</text><text x="680" y="525">Relevance + meaning</text></g>
<text x="582" y="364" class="num">vs</text><text x="72" y="662" class="small">Both matter. A successful enterprise project must survive both—without confusing them.</text>''')

svg('enterprise-experience-design-loop.svg', 'The Enterprise Experience Loop', 'Strategy, Experience, Design, Content and Technology connect through continuous feedback rather than a single sequential handoff.', '''
<text x="72" y="72" class="label">THE ENTERPRISE EXPERIENCE LOOP</text><text x="72" y="102" class="small">Continuous connection avoids expensive late-stage discoveries.</text>
<path d="M150 360 C260 177 420 177 510 360S760 543 870 360 1050 177 1062 360" fill="none" stroke="#A8442F" stroke-width="3"/>
<path d="M150 360 C264 543 420 543 510 360S760 177 870 360 1048 543 1062 360" fill="none" stroke="#C9C4BA" stroke-width="3"/>
<g><circle class="panel" cx="150" cy="360" r="76"/><text x="104" y="365" class="text">STRATEGY</text><circle class="dark" cx="350" cy="210" r="82"/><text x="293" y="215" class="white">EXPERIENCE</text><circle class="panel2" cx="510" cy="360" r="82"/><text x="468" y="365" class="text">DESIGN</text><circle class="dark" cx="710" cy="510" r="76"/><text x="670" y="515" class="white">CONTENT</text><circle class="panel" cx="870" cy="360" r="88"/><text x="818" y="365" class="text">TECHNOLOGY</text></g>
<text x="72" y="650" class="small">Instead of strategy → design → technology → content → QA, keep a shared experience point of view in the loop.</text>''')

svg('enterprise-experience-measurement-ladder.svg', 'The Experience Measurement Ladder', 'Output, Usage, Experience, Understanding, Behaviour and Outcome ascend toward increasingly meaningful value.', '''
<text x="72" y="72" class="label">THE EXPERIENCE MEASUREMENT LADDER</text><text x="72" y="102" class="small">Move beyond what is easiest to count toward what actually changed.</text>
<g><path d="M140 604H1090" class="line"/><path d="M160 550H1090" class="line"/><path d="M300 496H1090" class="line"/><path d="M440 442H1090" class="line"/><path d="M580 388H1090" class="line"/><path d="M720 334H1090" class="line"/></g>
<g><rect class="panel" x="140" y="550" width="190" height="54"/><text x="180" y="584" class="text">01 · OUTPUT</text><rect class="panel" x="280" y="496" width="190" height="54"/><text x="330" y="530" class="text">02 · USAGE</text><rect class="panel2" x="420" y="442" width="215" height="54"/><text x="445" y="476" class="text">03 · EXPERIENCE</text><rect class="panel2" x="560" y="388" width="250" height="54"/><text x="584" y="422" class="text">04 · UNDERSTANDING</text><rect class="dark" x="700" y="334" width="220" height="54"/><text x="730" y="368" class="white">05 · BEHAVIOUR</text><rect class="accent" x="840" y="280" width="250" height="54"/><text x="891" y="314" class="white">06 · OUTCOME</text></g>
<path d="M1060 252v-87" stroke="#A8442F" stroke-width="2.2"/><path d="M1048 177l12-12 12 12" fill="none" stroke="#A8442F" stroke-width="2.2"/><text x="936" y="145" class="label">INCREASING STRATEGIC VALUE</text>
<text x="72" y="670" class="small">The further down the ladder an organisation can measure, the more meaningful its evaluation becomes.</text>''')

svg('frontstage-backstage-enterprise-experience.svg', 'The Two-Sided Experience', 'A frontstage layer visible to an audience and backstage operations layer combine into one sustained enterprise experience.', '''
<text x="72" y="72" class="label">THE TWO-SIDED EXPERIENCE</text><text x="72" y="102" class="small">The audience should experience the frontstage. The organisation must sustain the backstage.</text>
<rect class="panel" x="72" y="146" width="1056" height="180" rx="4"/><text x="108" y="188" class="label">FRONTSTAGE · WHAT THE AUDIENCE SEES</text>
<g fill="#0C1830" font-family="Arial" font-size="16" font-weight="600"><text x="118" y="267">SPACE</text><text x="302" y="267">INTERFACE</text><text x="507" y="267">STORY</text><text x="670" y="267">INTERACTION</text><text x="914" y="267">CONTENT</text></g>
<path d="M72 365H1128" stroke="#A8442F" stroke-width="3"/><circle class="accent" cx="600" cy="365" r="44"/><text x="552" y="370" class="white">EXPERIENCE</text>
<rect class="dark" x="72" y="404" width="1056" height="180" rx="4"/><text x="108" y="446" fill="#D8B4A9" font-family="Arial" font-size="11" font-weight="700" letter-spacing="2">BACKSTAGE · WHAT MAKES IT WORK</text>
<g fill="#F8F3EB" font-family="Arial" font-size="16" font-weight="600"><text x="118" y="526">PEOPLE</text><text x="292" y="526">PROCESS</text><text x="472" y="526">CONTENT MANAGEMENT</text><text x="754" y="526">OPERATIONS</text><text x="960" y="526">GOVERNANCE</text></g>
<text x="72" y="662" class="small">One experience is not only what someone sees. It is what the organisation can continue to operate.</text>''')

svg('enterprise-experience-blueprint.svg', 'The Enterprise Experience Blueprint', 'A connected blueprint shows business intent becoming human outcome, audience, journey, principles, story and content, interaction and design, technology, operations and measurement.', '''
<text x="72" y="65" class="label">THE ENTERPRISE EXPERIENCE BLUEPRINT</text><text x="72" y="94" class="small">From enterprise ambition to an experience people can understand, use and sustain.</text>
<g><path d="M315 147h570" class="line"/><path d="M315 203h570" class="line"/><path d="M315 259h570" class="line"/><path d="M315 315h570" class="line"/><path d="M315 371h570" class="line"/><path d="M315 427h570" class="line"/><path d="M315 483h570" class="line"/><path d="M315 539h570" class="line"/></g>
<g>
<rect class="panel" x="315" y="113" width="570" height="68" rx="2"/><text x="349" y="155" class="text">01 · BUSINESS INTENT</text>
<rect class="panel2" x="315" y="181" width="570" height="68" rx="2"/><text x="349" y="223" class="text">02 · HUMAN OUTCOME</text>
<rect class="panel2" x="315" y="249" width="570" height="68" rx="2"/><text x="349" y="291" class="text">03 · AUDIENCE + JOURNEY</text>
<rect class="dark" x="315" y="317" width="570" height="68" rx="2"/><text x="349" y="359" class="white">04 · EXPERIENCE PRINCIPLES</text>
<rect class="panel" x="315" y="385" width="570" height="68" rx="2"/><text x="349" y="427" class="text">05 · STORY + CONTENT</text>
<rect class="panel" x="315" y="453" width="570" height="68" rx="2"/><text x="349" y="495" class="text">06 · INTERACTION + DESIGN</text>
<rect class="panel" x="315" y="521" width="570" height="68" rx="2"/><text x="349" y="563" class="text">07 · TECHNOLOGY + OPERATIONS</text>
<rect class="accent" x="315" y="589" width="570" height="68" rx="2"/><text x="349" y="631" class="white">08 · MEASUREMENT + LEARNING</text>
</g>
<text x="72" y="166" class="num">INTENT</text><text x="72" y="222" class="num">↓</text><text x="72" y="302" class="num">EXPERIENCE</text><text x="72" y="358" class="num">↓</text><text x="72" y="437" class="num">SYSTEM</text><text x="72" y="493" class="num">↓</text><text x="72" y="630" class="num">OUTCOME</text>
<text x="932" y="180" class="small">why</text><text x="932" y="318" class="small">for whom</text><text x="932" y="455" class="small">how</text><text x="932" y="592" class="small">sustain</text>''')

print('Created 10 enterprise framework SVGs')
