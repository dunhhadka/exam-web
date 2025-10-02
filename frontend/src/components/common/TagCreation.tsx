import { Button, Input } from "antd";
import { useState } from "react";
import styled from "@emotion/styled";
import { useCreateTagMutation } from "../../services/api/questionApi";
import { useToast } from "../../hooks/useToast";
import { TagRequest } from "../../types/question";

export const TagCreation = () => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");

  const [createTag, { isLoading: isCreateLoading }] = useCreateTagMutation();

  const toast = useToast();

  const handleCreate = async () => {
    try {
      const request: TagRequest = {
        name: name,
        colorCode: color,
      };
      await createTag(request).unwrap();
      toast.success("Tạo thẻ thành công");
      setName("");
      setColor("#000000");
    } catch (error) {
      toast.error("Tạo thẻ thất bại");
    }
  };

  return (
    <Container>
      <TitleStyle>Tạo thẻ mới</TitleStyle>

      <Field>
        <Input
          placeholder="Nhập tên thẻ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field>
        <Label>Màu sắc</Label>
        <ColorPickerWrapper>
          <ColorInput
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </ColorPickerWrapper>
      </Field>

      <Button
        type="primary"
        disabled={!name || !color}
        onClick={handleCreate}
        block
        loading={isCreateLoading}
      >
        Tạo mới thẻ
      </Button>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 20px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border-top: 1px solid #eee;
`;

const TitleStyle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const Field = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #555;
`;

const ColorPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ColorInput = styled.input`
  width: 50px;
  height: 32px;
  border: none;
  padding: 0;
  cursor: pointer;
`;

const ColorPreview = styled.div`
  width: 40px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #ddd;
`;
