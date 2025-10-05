import styled from "@emotion/styled";
import { useState } from "react";

export interface TrueFalseData {
  correctAnswer: boolean | null;
}

interface Props {
  text: string;
  data: TrueFalseData;
  questionNumber?: number;
  onChange?: (answer: boolean) => void;
  disabled?: boolean;
}

export const TrueFalsePreview = ({
  data,
  text,
  questionNumber = 1,
  onChange,
  disabled = false,
}: Props) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  const handleSelect = (answer: boolean) => {
    if (disabled) return;
    setSelectedAnswer(answer);
    onChange?.(answer);
  };

  return (
    <Container>
      <QuestionText>
        {questionNumber && (
          <QuestionNumber>Câu {questionNumber}: </QuestionNumber>
        )}
        {text}
      </QuestionText>

      <OptionsContainer>
        <OptionRow onClick={() => handleSelect(true)} disabled={disabled}>
          <RadioButton isSelected={selectedAnswer === true} />
          <OptionText>Đúng</OptionText>
        </OptionRow>

        <OptionRow onClick={() => handleSelect(false)} disabled={disabled}>
          <RadioButton isSelected={selectedAnswer === false} />
          <OptionText>Sai</OptionText>
        </OptionRow>
      </OptionsContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const QuestionText = styled.div`
  font-size: 15px;
  color: #202124;
  line-height: 1.5;
`;

const QuestionNumber = styled.span`
  font-weight: 600;
  color: #1a73e8;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
`;

const OptionRow = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: opacity 0.2s;

  &:hover {
    opacity: ${(props) => (props.disabled ? 0.6 : 0.8)};
  }
`;

const RadioButton = styled.div<{ isSelected?: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.isSelected ? "#1a73e8" : "#5f6368")};
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s;

  ${(props) =>
    props.isSelected &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #1a73e8;
    }
  `}
`;

const OptionText = styled.span`
  font-size: 14px;
  color: #202124;
  line-height: 1.5;
  user-select: none;
`;
