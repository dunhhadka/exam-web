import styled from "@emotion/styled";
import { Checkbox, Space } from "antd";
import { useState } from "react";

export interface Answer {
  orderIndex: number;
  label: string | null;
  isCorrect: boolean;
}

export interface MultiChoiceData {
  answers: Answer[];
}

interface Props {
  text: string;
  data: MultiChoiceData;
  questionNumber?: number;
  onChange?: (selectedIndexes: number[]) => void;
  disabled?: boolean;
}

export const MultiChoicePreview = ({
  text,
  data,
  questionNumber = 1,
  onChange,
  disabled = false,
}: Props) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  const handleChange = (checkedValues: any[]) => {
    setSelectedAnswers(checkedValues);
    onChange?.(checkedValues);
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

      <Checkbox.Group
        value={selectedAnswers}
        onChange={handleChange}
        disabled={disabled}
        style={{ marginTop: 12 }}
      >
        <Space direction="vertical" size={8}>
          {sortedAnswers.map((answer) => (
            <Checkbox
              key={answer.orderIndex}
              value={answer.orderIndex}
              style={{ marginTop: 8 }}
            >
              {answer.label || `Đáp án ${answer.orderIndex + 1}`}
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
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
