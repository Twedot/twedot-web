import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const sections = [
  {
    title: 'Introduction & Acceptance',
    content: (
      <>
        <p>Welcome to <strong>Twedot</strong> ("the App," "the Platform," "we," "us," or "our"), a mobile application developed and operated by <strong>Twedot Limited</strong> ("the Company"). Twedot is a global social and professional platform combining real-time encrypted messaging, ephemeral status updates, location-based discovery, peer-to-peer marketplace listings, and professional profile management in a single unified experience.</p>
        <p>By downloading, installing, accessing, or using Twedot in any way, you ("User," "you") agree to be legally bound by these Terms and Conditions ("Terms"), our Privacy Policy, and any supplemental policies we publish. <strong>If you do not agree to these Terms in their entirety, you must immediately stop using the App and delete it from your device.</strong></p>
        <p>These Terms constitute a binding legal agreement between you and Twedot Limited. We encourage you to read them carefully and keep a copy for your records.</p>
      </>
    ),
  },
  {
    title: 'Eligibility',
    content: (
      <>
        <p><strong>Age.</strong> You must be at least <strong>16 years of age</strong> to use Twedot. If you are between 16 and 18, you confirm that your parent or legal guardian has read and agreed to these Terms on your behalf. We do not knowingly collect personal data from anyone under 13. If we discover a user is under 13, their account and all associated data will be deleted immediately.</p>
        <p><strong>Legal Capacity.</strong> You represent that you have full legal capacity to enter into a binding agreement under the laws of your jurisdiction.</p>
        <p><strong>Geographic Access.</strong> Twedot is available globally. You are solely responsible for compliance with all local laws applicable to your use of the App, including laws on data privacy, communication, and commerce.</p>
      </>
    ),
  },
  {
    title: 'Account Registration, Login & Session Management',
    content: (
      <>
        <p><strong>Phone Verification.</strong> Registration requires a valid mobile phone number. We send a one-time passcode (OTP) via SMS to verify ownership. By registering you consent to receiving SMS messages for verification and critical account notices.</p>
        <p><strong>Profile Completion.</strong> After OTP verification, you must complete a profile (first name, last name, and optional profile photo) before accessing the main app. Incomplete profiles are held at the profile-setup screen until completion.</p>
        <p><strong>Accuracy.</strong> You agree to provide truthful, current, and complete information and to keep your profile up to date. Impersonating another person or entity is strictly prohibited.</p>
        <p><strong>Session Security.</strong> Your session token and device identifier are stored in encrypted local storage on your device. You must not share your OTP or session token with anyone. Notify us immediately if you suspect unauthorised access to your account.</p>
        <p><strong>Logout.</strong> You may log out at any time via Profile → Settings. Logout clears your authentication token, cached profile data, and disconnects the real-time socket connection. Your account and server-side data remain intact and accessible when you log back in.</p>
        <p><strong>Remove Account (Local).</strong> "Remove account" is a local-only action — it clears your token and local data from the device without deleting your server account. You can log back in on any device.</p>
        <p><strong>One Account Policy.</strong> Creating multiple accounts to circumvent a suspension, manipulate platform features, or deceive other users is prohibited and may result in all accounts being permanently terminated.</p>
      </>
    ),
  },
  {
    title: 'Description of Services',
    content: (
      <>
        <p>Twedot provides the following core services, each governed by these Terms:</p>
        <ul>
          <li><strong>Encrypted Messaging</strong> — Real-time end-to-end encrypted text, image, video, audio, voice note, document, contact, location, and item-reference messages.</li>
          <li><strong>Message Protection</strong> — Senders can lock individual messages to prevent forwarding; protected messages also trigger screenshot prevention on recipient devices.</li>
          <li><strong>Status / Stories</strong> — Ephemeral photo, video, and text updates — private (contacts only) or public (nearby users) — that expire after 24 hours.</li>
          <li><strong>Nearby Discovery</strong> — Location-based discovery of users, service providers, and marketplace listings in your vicinity.</li>
          <li><strong>Marketplace / Inventory</strong> — Creation and browsing of product and service listings on user profiles.</li>
          <li><strong>Professional Profile</strong> — Customisable profile with name, occupation, location, website, and inventory.</li>
          <li><strong>Contact Sync</strong> — Identifies which of your device contacts are already Twedot users.</li>
          <li><strong>Reactions & Replies</strong> — Emoji reactions (auto-expire after 7 days) and quoted replies within conversations.</li>
          <li><strong>Pickup Requests</strong> — In-chat request flow for arranging collection or delivery of marketplace items.</li>
        </ul>
        <p>We reserve the right to modify, suspend, or discontinue any service or feature at any time. We will give reasonable notice where practical, but we are not liable for changes to or removal of features.</p>
      </>
    ),
  },
  {
    title: 'End-to-End Encryption & Message Security',
    content: (
      <>
        <p><strong>How It Works.</strong> All chat messages sent through Twedot are <strong>end-to-end encrypted (E2EE)</strong>. Your device encrypts message content using the recipient's public key before sending. Only the recipient's device, holding the matching private key, can decrypt and read the content. The Twedot server handles only the encrypted payload — it cannot read, access, or process your message content.</p>
        <p><strong>Relay Architecture.</strong> The Twedot server is a relay, not a storage system for messages. When a recipient is online, the encrypted message is delivered in real-time and the server retains no copy. When a recipient is offline, the encrypted message is held in a temporary delivery queue for up to <strong>7 days</strong> and is permanently deleted the moment the recipient's device acknowledges receipt. No message content is ever written to a permanent database.</p>
        <p><strong>Local Device Storage.</strong> All chat history is stored exclusively on your device in an encrypted local database. If you lose your device, factory-reset it, or delete the App, your message history cannot be recovered from our servers.</p>
        <p><strong>No Server Reading.</strong> Twedot Limited, its employees, contractors, and partners cannot read, access, or disclose the content of your messages. We do not use message content for advertising, profiling, training AI models, or any other purpose.</p>
        <p><strong>Screenshot Prevention for Protected Messages.</strong> When a message marked as protected is visible on screen, the App activates the operating system's secure-screen flag (Android <code>FLAG_SECURE</code> / iOS equivalent), which prevents screenshots and screen recordings of that content on both Android and iOS.</p>
      </>
    ),
  },
  {
    title: 'Messaging Features',
    content: (
      <>
        <p><strong>Supported Message Types:</strong> Text, Image, Video, Audio / Voice Note, Document, Album, Contact, Location, Item Reference, Order / Booking, and Pickup Request.</p>
        <p><strong>Delivery Status.</strong> Each message displays a real-time indicator: Sending → Sent → Delivered → Read (blue double ticks).</p>
        <p><strong>Typing Indicators.</strong> A "typing…" indicator is shown to the other participant when you are composing. Typing events are rate-limited and expire automatically 1.5 seconds after you stop typing.</p>
        <p><strong>Emoji Reactions.</strong> You can react to any message with one emoji. Each user may place one reaction per message. Reactions are stored locally and broadcast in real-time. <strong>Reactions automatically expire and are deleted after 7 days.</strong></p>
        <p><strong>Message Search.</strong> You can search for text across your local message history within any chat. Search operates entirely on-device — no query is sent to our servers.</p>
        <p><strong>Clear Chat.</strong> You can clear all messages in a conversation from your device only. The recipient retains their copy. This action is irreversible on your device.</p>
        <p><strong>Export Chat.</strong> You may export a text transcript of a conversation for personal record-keeping. Exported files are stored on your device and are your sole responsibility.</p>
      </>
    ),
  },
  {
    title: 'Message Protection & Anti-Forwarding',
    content: (
      <>
        <p><strong>What It Is.</strong> The Message Protection feature allows a sender to lock any individual message, preventing the recipient from forwarding it to other users.</p>
        <p><strong>How to Protect a Message.</strong> Senders can mark a message as protected at the time of sending or at any point after sending, using the shield icon in the chat interface. Protection status is synchronised to the recipient's device in real-time.</p>
        <p><strong>Effect on Recipient.</strong> Once a message is protected: the forward button is disabled on the recipient's device; the message displays an orange "Protected — cannot forward" badge; and when the message is visible on screen, the operating system's <strong>screenshot and screen-recording prevention flag is activated</strong>.</p>
        <p><strong>Removing Protection.</strong> Only the original sender can remove protection. Once removed, the recipient regains the ability to forward the message and screenshot prevention is lifted.</p>
        <p><strong>Limitations.</strong> While Twedot takes technical measures to prevent forwarding and screenshotting within the App, we cannot prevent a user from photographing their screen with a separate device, reading content aloud, or otherwise reproducing content by external means. Message protection is a strong deterrent — it is not an absolute guarantee of confidentiality.</p>
      </>
    ),
  },
  {
    title: 'Message Forwarding, Deletion & Chain Removal',
    content: (
      <>
        <p><strong>Forwarding.</strong> You may forward any unprotected message to another contact. Forwarded messages are labelled "Forwarded" for the recipient. Each forwarded copy is linked to the original via a chain identifier, enabling chain-wide deletion.</p>
        <p><strong>Forward Notifications.</strong> The original sender receives a notification showing how many times their message has been forwarded. This is informational only.</p>
        <p><strong>Delete for Me.</strong> You may delete any message from your own device at any time. The recipient retains their copy.</p>
        <p><strong>Delete Everywhere.</strong> The original sender may delete a message from all devices — their own, the recipient's, and any forwarded copies across all chats. This action removes the message and all forwarded copies immediately from all recipient devices, cannot be undone, and applies only to the original sender's messages.</p>
        <p><strong>Limitations of Deletion.</strong> Delete Everywhere removes content from Twedot's delivery layer and all connected devices. However, if a recipient has already taken a screenshot, exported the chat, or copied the text, those external copies are beyond our control.</p>
      </>
    ),
  },
  {
    title: 'Status & Stories',
    content: (
      <>
        <p><strong>Overview.</strong> Status updates are ephemeral content — text, photos, or videos — that expire and are permanently deleted <strong>24 hours</strong> after posting. You may have multiple active statuses simultaneously.</p>
        <p><strong>Private Status.</strong> A private status is distributed exclusively to users in your contact list who have you saved on their device.</p>
        <p><strong>Public Status.</strong> A public status is visible to any Twedot user in your geographic vicinity. Your city-level location is associated with the update for proximity matching. Your exact GPS coordinates are never displayed to other users.</p>
        <p><strong>View Tracking.</strong> When another user views your status, their name and profile photo are recorded and shown to you in a "Viewers" list. By viewing someone's status, you consent to your identity being disclosed to that person as a viewer.</p>
        <p><strong>Deleting a Status.</strong> You may delete any of your own statuses at any time before expiry. Deletion removes the status from our servers and from the local cache on all recipient devices.</p>
        <p><strong>No Guarantee of Immediate Purge.</strong> While we make all reasonable efforts to delete expired statuses, we cannot guarantee immediate purging from all CDN edge nodes or recipient device caches.</p>
        <p><strong>Forwarding.</strong> Status content is not forwarded by the platform. Recipients may only view — not re-share within the App — your status updates.</p>
      </>
    ),
  },
  {
    title: 'Nearby Discovery & Location Services',
    content: (
      <>
        <p><strong>Purpose.</strong> The Nearby feature enables location-based discovery of other users, service providers, and marketplace listings in your geographic area.</p>
        <p><strong>Location Permission.</strong> This feature requires foreground location access. We collect your GPS coordinates solely to match you with nearby users and listings. You may revoke location permission at any time via device settings.</p>
        <p><strong>What Is Shared Publicly.</strong> Your public profile (name, occupation, profile photo, city, and inventory listings) is visible to other Twedot users in your vicinity. Your <strong>exact GPS coordinates are never displayed</strong> to other users — only approximate proximity tiers are used for matching.</p>
        <p><strong>Default Location.</strong> If location permission is denied, the App defaults to a base location for search purposes. No location data is collected if permission is not granted.</p>
        <p><strong>No Verification.</strong> We do not verify the accuracy, legitimacy, or safety of user profiles or listings surfaced through Nearby Discovery. You engage with discovered users and their offerings at your own risk.</p>
      </>
    ),
  },
  {
    title: 'Profile, Settings & Account Management',
    content: (
      <>
        <p><strong>Profile Fields.</strong> Your profile may include: first name, last name, occupation/role, profile photo, city, country, and an optional website link.</p>
        <p><strong>Profile Sharing.</strong> You may share your profile via a deep link. Anyone with this link who has Twedot installed can view your public profile.</p>
        <p><strong>Available Settings:</strong></p>
        <ul>
          <li><strong>Account</strong> — Request account data; remove account from device; delete account permanently.</li>
          <li><strong>Contacts</strong> — Manage synced contacts; toggle Twedot Contacts sync.</li>
          <li><strong>Preferences</strong> — Notification popup behaviour; Language; App theme (Light / Dark / System).</li>
          <li><strong>Blocked Contacts</strong> — View, search, add, and remove blocked users.</li>
          <li><strong>Inventory</strong> — Create, edit, and delete marketplace listings.</li>
          <li><strong>Edit Profile</strong> — Update name, occupation, profile photo, and website.</li>
        </ul>
        <p><strong>Account Deletion.</strong> Permanent account deletion is available in Account settings. Upon confirmation, your profile, messages, listings, and status updates are removed and your session is terminated. <strong>This action is irreversible.</strong> Deleted accounts and their data cannot be recovered.</p>
      </>
    ),
  },
  {
    title: 'Blocking',
    content: (
      <>
        <p><strong>How to Block.</strong> You may block any user via the Blocked Contacts settings screen or directly from a chat or profile. Blocking is immediate.</p>
        <p><strong>Effect of Blocking.</strong> When you block a user: any messages they attempt to send you are silently discarded at the server level — not stored, not queued, and no notification is generated on your device. The blocked user does not receive any indication they have been blocked. The blocked user cannot view your status updates and is removed from your Nearby Discovery results.</p>
        <p><strong>Unblocking.</strong> You may unblock a user at any time. Unblocking restores normal messaging and status visibility from that point forward. It does not restore any messages that were discarded during the block period.</p>
      </>
    ),
  },
  {
    title: 'Marketplace & Inventory Listings',
    content: (
      <>
        <p><strong>Nature of Service.</strong> Twedot provides tools to create, display, and browse product and service listings. These listings appear on user profiles and in Nearby Discovery results.</p>
        <p><strong>No Payment Processing.</strong> Twedot does <strong>not</strong> currently process, intermediate, or hold any payments between buyers and sellers. All financial arrangements are made directly between users. We are not a party to any transaction.</p>
        <p><strong>Seller Responsibilities.</strong> By creating a listing you confirm that you own the item or have the legal right to sell it, the description and images are accurate, the item is lawful in applicable jurisdictions, and you will fulfil agreed transactions honestly.</p>
        <p><strong>Buyer Responsibilities.</strong> You conduct all transactions at your own risk. Twedot assumes no responsibility for failed transactions, misrepresented listings, non-delivery, or disputes.</p>
        <p><strong>Prohibited Listings.</strong> The following may not be listed: illegal goods or services; controlled or prescription substances; weapons, firearms, or explosives; counterfeit, pirated, or stolen goods; protected animals or their parts; unauthorised financial products; adult content or services; any item or service violating applicable law.</p>
        <p><strong>Dispute Resolution for Transactions.</strong> All marketplace disputes are strictly between buyer and seller. Twedot has no obligation to mediate, arbitrate, or compensate in connection with any user transaction.</p>
      </>
    ),
  },
  {
    title: 'Media Uploads & Local Caching',
    content: (
      <>
        <p><strong>Supported Formats.</strong> Twedot accepts images (JPEG, PNG, WebP), videos (MP4, MOV, AVI, MKV, WebM), audio files (M4A, MP3), documents (PDF, DOCX, and common office formats), and in-app recorded voice notes.</p>
        <p><strong>Upload & CDN.</strong> Media files you send in messages or post as statuses are uploaded to our cloud infrastructure and served via CDN for delivery to recipients.</p>
        <p><strong>Local Caching.</strong> The App automatically caches received status media and downloaded message media to your device's local cache directory, enabling offline viewing of previously loaded content. Cached files are managed automatically and cleared when statuses expire or when the App purges old content.</p>
        <p><strong>Content Scanning.</strong> We reserve the right to implement automated scanning of uploaded media using industry-standard hash-matching to detect known illegal content (e.g., CSAM, designated terrorist material). Such scanning is for law enforcement compliance only and is not used for advertising or profiling.</p>
      </>
    ),
  },
  {
    title: 'Notifications',
    content: (
      <>
        <p><strong>Push Notifications.</strong> Twedot sends push notifications to alert you of new messages, status updates, and other platform activity via Apple APNs (iOS) and Google FCM (Android).</p>
        <p><strong>Notification Preferences.</strong> You can customise notification popup behaviour in Settings → Preferences: no popup; only when screen is on; only when screen is off; or always show popup.</p>
        <p><strong>Inline Replies.</strong> On supported devices, you may reply to a message notification directly from the notification shade without opening the App.</p>
        <p><strong>Opting Out.</strong> You may disable push notifications at any time via your device's notification settings. Disabling notifications does not affect message delivery — messages will still arrive when you open the App.</p>
      </>
    ),
  },
  {
    title: 'Contact Synchronisation',
    content: (
      <>
        <p>When you grant the Contacts permission, the App identifies which of your device contacts are registered Twedot users and adds them to your in-app contacts list. Unmatched numbers are discarded immediately and never stored on our servers.</p>
        <p>You may disable contact sync at any time via Settings → Contacts. For full details on how contact data is handled, see our <a href="/privacy">Privacy Policy</a>.</p>
      </>
    ),
  },
  {
    title: 'User Content & Licence',
    content: (
      <>
        <p><strong>Your Ownership.</strong> You retain all ownership rights in any content you create, upload, or share on the platform ("User Content"), including text, photos, videos, voice notes, documents, status updates, and inventory listings.</p>
        <p><strong>Licence to Twedot.</strong> By uploading or sharing User Content, you grant Twedot Limited a worldwide, non-exclusive, royalty-free, sublicensable licence to host, store, transmit, and display your content solely for the purpose of operating the platform and delivering content to your intended recipients. This licence does not permit us to use your content for advertising, to sell it, or to disclose it to third parties except as described in the Privacy section. This licence terminates when you delete the content or your account.</p>
        <p><strong>Your Responsibility.</strong> You are solely responsible for all User Content you submit. You represent and warrant that you own or hold all necessary rights for the content, it does not infringe any third-party rights, and it complies with all applicable laws and these Terms.</p>
        <p><strong>Content Moderation.</strong> We reserve the right to review, remove, or restrict access to any User Content at our sole discretion without prior notice if we determine it violates these Terms, applicable law, or poses a risk to user safety.</p>
      </>
    ),
  },
  {
    title: 'Prohibited Conduct',
    content: (
      <>
        <p>You agree not to use Twedot to:</p>
        <ul>
          <li><strong>Illegal Activity.</strong> Engage in, facilitate, or promote any activity that violates applicable laws, including fraud, money laundering, drug trafficking, terrorism, or cybercrime.</li>
          <li><strong>Harmful Content.</strong> Upload, transmit, or share content that is defamatory, threatening, harassing, abusive, obscene, or otherwise harmful.</li>
          <li><strong>Child Safety.</strong> Post, share, solicit, or distribute child sexual abuse material (CSAM) or any content that exploits or endangers minors. Zero-tolerance — violations will be reported to law enforcement immediately without exception.</li>
          <li><strong>Impersonation & Fraud.</strong> Impersonate any individual or organisation; misrepresent your identity; operate fake accounts; conduct phishing or social engineering attacks.</li>
          <li><strong>Spam & Automation.</strong> Send unsolicited bulk messages; operate bots or automated scripts; harvest user data or contact information.</li>
          <li><strong>Platform Interference.</strong> Reverse-engineer or decompile the App; probe or exploit security vulnerabilities; introduce malware; interfere with platform infrastructure; scrape data.</li>
          <li><strong>Circumventing Safety Features.</strong> Attempt to bypass message protection, screenshot prevention, or blocking mechanisms through technical means or workarounds.</li>
          <li><strong>Marketplace Abuse.</strong> Create fraudulent listings; misrepresent products or services; conduct scam transactions.</li>
          <li><strong>Privacy Violations.</strong> Share another person's private information — including private messages, home address, financial details, or private images — without their express consent.</li>
          <li><strong>Hate Speech.</strong> Post content promoting discrimination, violence, or hatred based on race, ethnicity, religion, gender, sexual orientation, disability, nationality, or any other protected characteristic.</li>
        </ul>
        <p>Violations may result in immediate content removal, account suspension or permanent termination, reporting to authorities, and/or legal action.</p>
      </>
    ),
  },
  {
    title: 'Privacy & Data Collection',
    content: (
      <>
        <p>Twedot's data collection and privacy practices are governed exclusively by our <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference. In the event of any conflict between these Terms and the Privacy Policy on privacy matters, the Privacy Policy governs.</p>
        <p>By using Twedot you agree to the data practices described in the Privacy Policy. We strongly encourage you to read it in full.</p>
      </>
    ),
  },
  {
    title: 'Permissions',
    content: (
      <>
        <p>Twedot requests device permissions (Location, Microphone, Camera, Photo Library, Contacts, Notifications) to enable specific features. You may grant or revoke any permission at any time via your device settings; revoking a permission disables only the corresponding feature.</p>
        <p>Full details on what each permission is used for and how the associated data is handled are in our <a href="/privacy">Privacy Policy</a> under "Device Permissions."</p>
      </>
    ),
  },
  {
    title: 'Intellectual Property',
    content: (
      <>
        <p><strong>Our IP.</strong> All intellectual property in the Twedot platform — including the App software, branding, logos, UI design, trademarks, trade dress, and proprietary algorithms — is owned by or licensed to Twedot Limited. Nothing in these Terms grants you any rights beyond the limited, non-exclusive, non-transferable licence to use the App on your personal device for its intended purpose.</p>
        <p><strong>Feedback.</strong> If you submit feedback, suggestions, or ideas to us, you grant Twedot Limited an irrevocable, perpetual, worldwide, royalty-free licence to use that feedback for any purpose without obligation or compensation to you.</p>
        <p><strong>Copyright Complaints.</strong> If you believe content on Twedot infringes your copyright, contact us at <a href="mailto:legal@twedot.com">legal@twedot.com</a> with: your contact details; identification of the copyrighted work; identification of the infringing content; a good-faith belief statement; and a statement of accuracy under penalty of perjury.</p>
      </>
    ),
  },
  {
    title: 'Third-Party Services',
    content: (
      <>
        <p>The App integrates with or relies on the following third-party services:</p>
        <ul>
          <li><strong>Cloud Infrastructure (AWS or equivalent)</strong> — Hosting, media storage, CDN delivery</li>
          <li><strong>SMS Gateway</strong> — OTP delivery for verification</li>
          <li><strong>Expo / React Native</strong> — Mobile application framework</li>
          <li><strong>Apple APNs / Google FCM</strong> — Push notification delivery</li>
          <li><strong>OpenStreetMap / Photon Geocoder</strong> — Address search for service location setup</li>
          <li><strong>Redis</strong> — Temporary offline message queue (7-day TTL)</li>
        </ul>
        <p>Your use of third-party services is also governed by their respective terms and privacy policies. Twedot is not responsible for the availability, conduct, or data practices of any third-party provider. Links or references to external websites within the App are provided for convenience only.</p>
      </>
    ),
  },
  {
    title: 'Disclaimer of Warranties',
    content: (
      <>
        <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TWEDOT AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND — EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.</strong></p>
        <p>We specifically disclaim: warranties of merchantability, fitness for a particular purpose, or non-infringement; warranties that the App will be uninterrupted, error-free, or free of harmful components; warranties as to the accuracy or completeness of any user-generated content or marketplace listing; warranties that any marketplace transaction will be completed satisfactorily; and warranties that message protection or screenshot prevention will be effective in every circumstance or on every device.</p>
        <p>Some jurisdictions do not allow the exclusion of implied warranties, so the above may not apply to you in full.</p>
      </>
    ),
  },
  {
    title: 'Limitation of Liability',
    content: (
      <>
        <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</strong></p>
        <p>TWEDOT LIMITED, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES — INCLUDING LOSS OF PROFITS, DATA, REVENUE, GOODWILL, OR BUSINESS — ARISING FROM YOUR USE OF OR INABILITY TO USE THE APP, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
        <p>OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS SHALL NOT EXCEED THE GREATER OF: (A) AMOUNTS YOU PAID TO TWEDOT IN THE 12 MONTHS PRECEDING THE CLAIM; OR (B) NGN 5,000 (FIVE THOUSAND NAIRA) OR EQUIVALENT IN YOUR LOCAL CURRENCY.</p>
        <p><strong>User Interactions.</strong> We are not liable for any harm arising from your interactions with other users, including meetings arranged through the App, marketplace transactions, or reliance on user content.</p>
        <p><strong>Message Protection Limitations.</strong> We are not liable for the disclosure of protected message content by means outside our technical control (e.g., photographing the screen with a separate device).</p>
        <p><strong>Force Majeure.</strong> We are not liable for failure or delay caused by events outside our reasonable control: natural disasters, acts of government, internet infrastructure failures, cyberattacks, or third-party service outages.</p>
      </>
    ),
  },
  {
    title: 'Indemnification',
    content: (
      <>
        <p>You agree to defend, indemnify, and hold harmless Twedot Limited, its directors, officers, employees, agents, and licensors from and against all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from or related to:</p>
        <ul>
          <li>Your use of the App or any service;</li>
          <li>Your User Content;</li>
          <li>Your violation of these Terms or any applicable law;</li>
          <li>Any marketplace transaction you enter into with another user;</li>
          <li>Any harm caused by your misuse of the message protection, blocking, or deletion features;</li>
          <li>Unauthorised use of your account.</li>
        </ul>
        <p>We may assume exclusive control of any matter subject to indemnification. You agree to cooperate with our defence.</p>
      </>
    ),
  },
  {
    title: 'Account Suspension & Termination',
    content: (
      <>
        <p><strong>Termination by You.</strong> You may permanently delete your account at any time via Settings → Account → Delete account. The effects of deletion are described in Section 11.</p>
        <p><strong>Termination by Us.</strong> We may suspend or permanently terminate your account immediately and without prior notice for: material or repeated violation of these Terms; illegal, harmful, or fraudulent conduct; extended inactivity (24+ consecutive months with prior notice); court orders or law enforcement requests; or discontinuation of the App.</p>
        <p><strong>Effect of Termination.</strong> Upon termination, your right to use the App ceases immediately. Sections covering E2EE, User Content Licence, Intellectual Property, Limitation of Liability, Indemnification, and Dispute Resolution survive termination.</p>
        <p><strong>Appeals.</strong> If you believe your account was suspended in error, contact us at <a href="mailto:support@twedot.com">support@twedot.com</a>. We are not obligated to reinstate any suspended account.</p>
      </>
    ),
  },
  {
    title: 'Dispute Resolution & Governing Law',
    content: (
      <>
        <p><strong>Governing Law.</strong> These Terms are governed by the laws of the <strong>Federal Republic of Nigeria</strong>, without regard to its conflict of law principles.</p>
        <p><strong>Informal Resolution.</strong> Before initiating formal proceedings, contact us at <a href="mailto:legal@twedot.com">legal@twedot.com</a> and allow 30 days for good-faith informal resolution.</p>
        <p><strong>Arbitration.</strong> Unresolved disputes shall be settled by binding arbitration under the Arbitration and Conciliation Act (Cap A18) Laws of the Federation of Nigeria 2004 (or its successor), administered by a mutually agreed arbitrator seated in <strong>Lagos, Nigeria</strong>. Proceedings shall be in English. The arbitral award is final and binding.</p>
        <p><strong>Class Action Waiver.</strong> TO THE EXTENT PERMITTED BY LAW, YOU WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTION LAWSUITS OR CLASS-WIDE ARBITRATION AGAINST TWEDOT.</p>
        <p><strong>International Users.</strong> Users in jurisdictions with mandatory consumer protection laws (including EU/UK GDPR, Australian Consumer Law, or US state privacy laws) retain any rights that cannot be lawfully waived.</p>
      </>
    ),
  },
  {
    title: 'Changes to These Terms',
    content: (
      <>
        <p>We may update these Terms at any time. We will notify you of material changes via in-app notification or push notification at least <strong>14 days</strong> before the changes take effect.</p>
        <p>Continuing to use the App after the effective date constitutes acceptance of the revised Terms. If you do not accept the changes, you must stop using the App and delete your account before the effective date.</p>
        <p>A version history of these Terms will be accessible from within the App or our website.</p>
      </>
    ),
  },
  {
    title: 'Contact Information',
    content: (
      <>
        <p>For legal notices, copyright complaints, data requests, account issues, and general support:</p>
        <p>
          <strong>Twedot Limited</strong><br />
          Email: <a href="mailto:legal@twedot.com">legal@twedot.com</a><br />
          Support: <a href="mailto:support@twedot.com">support@twedot.com</a>
        </p>
        <p style={{ opacity: 0.6, fontSize: 13 }}><em>Physical address and company registration number to be inserted upon incorporation.</em></p>
      </>
    ),
  },
  {
    title: 'Definitions',
    content: (
      <>
        <ul>
          <li><strong>App / Platform</strong> — The Twedot mobile application and all associated backend services.</li>
          <li><strong>User Content</strong> — Any text, image, video, audio, document, listing, status, or other material you submit.</li>
          <li><strong>E2EE</strong> — End-to-End Encryption — content encrypted on sender's device, decryptable only on recipient's device.</li>
          <li><strong>Status</strong> — An ephemeral update (text, photo, or video) expiring 24 hours after posting.</li>
          <li><strong>Message Protection</strong> — A sender-controlled flag that prevents forwarding and activates screenshot prevention on the recipient's device.</li>
          <li><strong>Chain Deletion</strong> — Deletion of a message and all copies created through forwarding.</li>
          <li><strong>Nearby Discovery</strong> — Location-based feature for finding users and listings in geographic proximity.</li>
          <li><strong>Inventory / Marketplace</strong> — Product and service listing functionality on user profiles.</li>
          <li><strong>OTP</strong> — One-Time Passcode delivered via SMS for account verification.</li>
          <li><strong>Contact Sync</strong> — Process of matching device contacts with registered Twedot users.</li>
          <li><strong>Relay Architecture</strong> — Server design in which message content is never stored permanently — only relayed to recipients.</li>
          <li><strong>Session Token</strong> — An encrypted credential stored on your device that authenticates your session.</li>
        </ul>
      </>
    ),
  },
];

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms & Conditions — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 68, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 56px 120px' }}>

          {/* Page header */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 20, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Legal</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900,
              letterSpacing: '-3px', color: 'var(--text)',
              lineHeight: 0.92, textTransform: 'uppercase', marginBottom: 20,
            }}>
              Terms &<br /><span style={{ color: 'var(--purple)' }}>Conditions</span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', opacity: 0.7 }}>
              Effective Date: 1 June 2025 · Last Updated: 22 May 2025 · Version 2.0
            </p>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sections.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 56, alignItems: 'flex-start',
                  padding: '40px 0',
                  borderTop: '1px solid var(--border-sub)',
                }}
              >
                <div style={{ width: 220, flexShrink: 0 }}>
                  <span style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    color: 'var(--purple)', opacity: 0.55,
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 style={{
                    fontSize: 16, fontWeight: 800, color: 'var(--text)',
                    lineHeight: 1.3, letterSpacing: '-0.2px',
                  }}>
                    {s.title}
                  </h2>
                </div>

                <div style={{ flex: 1, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.9 }}>
                  <style>{`
                    .legal-content p { margin-bottom: 12px; }
                    .legal-content p:last-child { margin-bottom: 0; }
                    .legal-content a { color: var(--purple); text-decoration: none; }
                    .legal-content a:hover { text-decoration: underline; }
                    .legal-content strong { color: var(--text); font-weight: 700; }
                    .legal-content ul { padding-left: 20px; margin-bottom: 12px; }
                    .legal-content li { margin-bottom: 6px; }
                    .legal-content code { background: var(--bg-card); padding: 1px 5px; border-radius: 4px; font-size: 13px; }
                  `}</style>
                  <div className="legal-content">{s.content}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
