import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-US')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              UNVRS LABS ("we", "our" or "us") operates the UNVRS Magic AI platform. 
              This Privacy Policy describes how we collect, use and protect your personal information 
              when you use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">We collect the following categories of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account information:</strong> Name, email, phone number when you create an account.</li>
              <li><strong>Usage data:</strong> Information about how you use our services.</li>
              <li><strong>Social media connections:</strong> When you connect social accounts (Instagram, YouTube, TikTok), 
                  we receive access tokens to publish content on your behalf.</li>
              <li><strong>Generated content:</strong> Images and videos you create using our AI tools.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Use of Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and improve our services</li>
              <li>Generate AI content according to your requests</li>
              <li>Publish content to your connected social accounts</li>
              <li>Manage your account and transactions</li>
              <li>Communicate updates and service information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. YouTube Data Access</h2>
            <p className="text-muted-foreground mb-4">
              When you connect your YouTube account, we request access to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>View your YouTube channel information</li>
              <li>Manage your videos and live streaming</li>
              <li>Publish content on your behalf</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You can revoke access at any time from your Google Account settings: {" "}
              <a 
                href="https://myaccount.google.com/permissions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://myaccount.google.com/permissions
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Information Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share your information only with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Service providers who help us run the platform (e.g. hosting, AI generation)</li>
              <li>Social media platforms when you publish content through our service</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Security</h2>
            <p className="text-muted-foreground">
              We implement technical and organizational security measures to protect your information, 
              including encryption of sensitive data and limited access to personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent to processing</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as necessary to provide our services or as required by law. 
              You can request deletion of your account at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Changes to Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy periodically. We will notify you of significant changes 
              via email or notice on the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact</h2>
            <p className="text-muted-foreground">
              For questions about our Privacy Policy or your data processing, contact us at:{" "}
              <a href="mailto:privacy@unvrslabs.com" className="text-primary hover:underline">
                privacy@unvrslabs.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
