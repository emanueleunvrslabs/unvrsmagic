import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-US')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By using UNVRS Magic AI ("Service"), you agree to be bound by these Terms of Service. 
              If you do not accept these terms, do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Service Description</h2>
            <p className="text-muted-foreground">
              UNVRS Magic AI is a platform that offers AI-based content generation tools, 
              including the creation of images, videos and automated social media management.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. User Account</h2>
            <p className="text-muted-foreground mb-4">To use the Service you must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your access credentials</li>
              <li>Notify us immediately in case of unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">You agree not to use the Service for:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Generating illegal, defamatory or offensive content</li>
              <li>Violating third-party intellectual property rights</li>
              <li>Creating deepfakes or misleading content</li>
              <li>Spam or unauthorized marketing activities</li>
              <li>Any activity that violates applicable laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Credits and Payments</h2>
            <p className="text-muted-foreground">
              The Service uses a credit system for content generation. 
              Purchased credits are non-refundable except as required by applicable law. 
              Prices may be changed with notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Content Ownership</h2>
            <p className="text-muted-foreground">
              Content you generate using the Service is your property, subject to the terms 
              of the underlying AI platforms. You grant us a limited license to store and 
              process your content in order to provide the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Social Media Connection</h2>
            <p className="text-muted-foreground">
              When you connect social media accounts (Instagram, YouTube, TikTok), you authorize us to publish 
              content on your behalf according to your instructions. You are responsible for ensuring that 
              published content complies with the respective platforms' terms of service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              The Service is provided "as is" without warranties of any kind. We are not responsible for 
              indirect, incidental or consequential damages arising from use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. Changes will be effective 
              from publication on the site. Continued use of the Service constitutes acceptance 
              of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access to the Service at any time for 
              violation of these Terms or for any other reason at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by Italian law. Any dispute shall be submitted 
              to the exclusive jurisdiction of Italian courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, contact us at:{" "}
              <a href="mailto:legal@unvrslabs.com" className="text-primary hover:underline">
                legal@unvrslabs.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
