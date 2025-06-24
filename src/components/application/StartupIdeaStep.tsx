
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApplicationSuccess from './ApplicationSuccess';
import ExpectationSelector from './ExpectationSelector';
import IdeaDescriptionField from './IdeaDescriptionField';
import ChallengesField from './ChallengesField';
import { useApplicationSubmission } from '@/hooks/useApplicationSubmission';

interface StartupIdeaStepProps {
  data: any;
  updateData: (data: any) => void;
  onPrev: () => void;
}

const StartupIdeaStep = ({ data, updateData, onPrev }: StartupIdeaStepProps) => {
  const { submitting, applicationId, submitted, submitApplication } = useApplicationSubmission();

  const handleExpectationChange = (expectation: string, checked: boolean) => {
    const currentExpectations = data.expectations || [];
    if (checked) {
      updateData({ expectations: [...currentExpectations, expectation] });
    } else {
      updateData({ expectations: currentExpectations.filter((e: string) => e !== expectation) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitApplication(data);
  };

  // Show success component if submitted
  if (submitted && applicationId) {
    return <ApplicationSuccess applicationId={applicationId} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Startup Idea & Expectations</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <IdeaDescriptionField
            value={data.ideaDescription || ''}
            onChange={(value) => updateData({ ideaDescription: value })}
          />

          <ExpectationSelector
            selectedExpectations={data.expectations || []}
            onExpectationChange={handleExpectationChange}
          />

          <ChallengesField
            value={data.challenges || ''}
            onChange={(value) => updateData({ challenges: value })}
          />

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              Previous
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StartupIdeaStep;
