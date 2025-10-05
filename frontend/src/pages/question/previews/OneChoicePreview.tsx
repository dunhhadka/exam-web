import styled from "@emotion/styled";
import { Radio, Space } from "antd";
import { useState } from "react";

export interface Answer {
  orderIndex: number;
  label: string | null;
  isCorrect: boolean;
}

export interface OneChoiceData {
  answers: Answer[];
}

interface Props {
  text: string;
  data: OneChoiceData;
  questionNumber?: number;
  onChange?: (answerIndex: number) => void;
  disabled?: boolean;
}

export const OneChoicePreview = ({
  text,
  data,
  questionNumber = 1,
  onChange,
  disabled = false,
}: Props) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleChange = (e: any) => {
    const value = e.target.value;
    setSelectedAnswer(value);
    onChange?.(value);
  };

  // Sắp xếp answers theo orderIndex
  const sortedAnswers = [...data.answers].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <Container>
      <QuestionText>
        {questionNumber && (
          <QuestionNumber>Câu {questionNumber}: </QuestionNumber>
        )}
        {text}
      </QuestionText>

      <Radio.Group
        value={selectedAnswer}
        onChange={handleChange}
        disabled={disabled}
        style={{ marginTop: 12 }}
      >
        <Space direction="vertical" size={8}>
          {sortedAnswers.map((answer) => (
            <Radio
              key={answer.orderIndex}
              value={answer.orderIndex}
              style={{ marginTop: 4 }}
            >
              {answer.label || `Đáp án ${answer.orderIndex + 1}`}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
