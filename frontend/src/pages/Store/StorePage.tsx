import React, { useState, useMemo } from 'react';
import { Button, Tree, Modal, Input, Upload, message, Spin, Tooltip, Tag, Image } from 'antd';
import { FolderOutlined, FolderOpenOutlined, FileOutlined, UploadOutlined, DeleteOutlined, ExclamationCircleOutlined, CalendarOutlined, UserOutlined, FolderFilled, FileFilled } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { UploadFile } from 'antd/es/upload/interface';
import { 
  useGetStorageStatsQuery, 
  useListStorageFilesQuery,
  useDeleteStorageMutation,
  type StorageFileResponse 
} from '../../services/api/storageApi';

const { confirm } = Modal;

const ResultPage = () => {
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'folder' | 'file'>('folder');
  const [folderName, setFolderName] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch storage stats and files
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetStorageStatsQuery();
  const { data: files, isLoading: filesLoading, error: filesError } = useListStorageFilesQuery(currentPath);
  const [deleteStorage] = useDeleteStorageMutation();

  // Get readable folder/file name with explanation
  const getReadableName = (name: string, type: string, path: string, sizeFormatted?: string): React.ReactNode => {
    const parts = path.split('/').filter(Boolean);
    
    // Level 1: Session ID (e.g., "11")
    if (parts.length === 2 && type === 'folder') {
      return (
        <Tooltip title="Phiên thi (Session ID)">
          <span>
            <Tag color="blue" icon={<FolderFilled />} style={{ marginRight: 8 }}>
              Phiên {name}
            </Tag>
          </span>
        </Tooltip>
      );
    }
    
    // Level 2: Email (e.g., "phamha4312_at_gmail_com")
    if (parts.length === 3 && type === 'folder') {
      const email = name.replace(/_at_/g, '@').replace(/_/g, '.');
      return (
        <Tooltip title={`Email thí sinh: ${email}`}>
          <span>
            <Tag color="green" icon={<UserOutlined />} style={{ marginRight: 8 }}>
              {email}
            </Tag>
          </span>
        </Tooltip>
      );
    }
    
    // Level 3: File index (e.g., "1", "2")
    if (type === 'file') {
      const fileNumber = name;
      return (
        <Tooltip title={`Ảnh khuôn mặt whitelist số ${fileNumber}`}>
          <span>
            <FileFilled style={{ color: '#1890ff', marginRight: 8 }} />
            Ảnh {fileNumber}
            {sizeFormatted && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                {sizeFormatted}
              </Tag>
            )}
          </span>
        </Tooltip>
      );
    }
    
    return name;
  };

  // Convert StorageFileResponse to Ant Design TreeNode
  const convertToTreeData = (fileList: StorageFileResponse[], level: number = 0): DataNode[] => {
    return fileList.map((file) => ({
      title: getReadableName(file.name, file.type, file.path, file.sizeFormatted),
      key: file.path,
      isLeaf: file.type === 'file',
      children: file.children && file.children.length > 0 
        ? convertToTreeData(file.children, level + 1) 
        : undefined,
    }));
  };

  const treeData: DataNode[] = useMemo(() => {
    if (!files || files.length === 0) {
      return [
        {
          title: 'Không có dữ liệu',
          key: 'empty',
          icon: <FolderOutlined />,
          disabled: true,
          isLeaf: true,
        },
      ];
    }
    return convertToTreeData(files);
  }, [files]);

  const handleAddFolder = () => {
    setModalType('folder');
    setFolderName('');
    setIsModalOpen(true);
  };

  const handleAddFiles = () => {
    setModalType('file');
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleModalOk = () => {
    if (modalType === 'folder') {
      if (!folderName.trim()) {
        message.error('Vui lòng nhập tên thư mục');
        return;
      }
      // TODO: Call API to create folder
      console.log('Creating folder:', folderName);
      message.success('Tạo thư mục thành công');
    } else {
      if (fileList.length === 0) {
        message.error('Vui lòng chọn file');
        return;
      }
      // TODO: Call API to upload files
      console.log('Uploading files:', fileList);
      message.success('Upload file thành công');
    }
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    console.log('handleDelete called, selectedKeys:', selectedKeys);
    
    if (selectedKeys.length === 0) {
      message.warning('Vui lòng chọn file/folder cần xóa');
      return;
    }

    const selectedPath = selectedKeys[0] as string;
    console.log('Selected path:', selectedPath);
    
    const selectedFile = findFileByPath(files || [], selectedPath);
    console.log('Found file:', selectedFile);

    if (!selectedFile) {
      message.error('Không tìm thấy file/folder để xóa');
      return;
    }

    console.log('Calling deleteStorage API with:', {
      path: selectedPath,
      recursive: selectedFile.type === 'folder',
    });
    
    try {
      const result = await deleteStorage({
        path: selectedPath,
        recursive: selectedFile.type === 'folder',
      }).unwrap();
      
      console.log('Delete result:', result);
      message.success('Xóa thành công');
      setSelectedKeys([]);
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('Xóa thất bại');
    }
  };

  const findFileByPath = (fileList: StorageFileResponse[], path: string): StorageFileResponse | null => {
    for (const file of fileList) {
      if (file.path === path) return file;
      if (file.children) {
        const found = findFileByPath(file.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    beforeUpload: () => {
      return false; // Prevent auto upload
    },
    multiple: true,
  };

  const usedStorage = stats?.usedSizeBytes ? stats.usedSizeBytes / (1024 * 1024) : 0.0;
  const totalStorage = stats?.totalSizeBytes ? stats.totalSizeBytes / (1024 * 1024) : 200.0;
  const remainingStorage = stats?.remainingSizeBytes ? stats.remainingSizeBytes / (1024 * 1024) : 200.0;
  const percentUsed = (usedStorage / totalStorage) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentUsed / 100) * circumference;

  return (
    <div style={{ 
      padding: '24px', 
      height: '100vh', 
      display: 'flex', 
      gap: '24px',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Left Panel - Storage Info */}
      <div style={{
        width: '350px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        height: 'fit-content',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          margin: '0 0 32px 0', 
          fontSize: '18px',
          fontWeight: '500'
        }}>
          Dung lượng lưu trữ
        </h2>

        {/* SVG Circle Chart */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <div style={{ position: 'relative', width: '200px', height: '200px' }}>
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#e8e8e8"
                strokeWidth="16"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#1890ff"
                strokeWidth="16"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                marginBottom: '4px'
              }}>
                Tổng
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#000'
              }}>
                {totalStorage.toFixed(2)} MB
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              backgroundColor: '#1890ff',
              borderRadius: '2px'
            }}></div>
            <span style={{ flex: 1, fontSize: '14px', color: '#666' }}>
              Đang dùng
            </span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>
              {usedStorage.toFixed(2)} MB
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              backgroundColor: '#e8e8e8',
              borderRadius: '2px'
            }}></div>
            <span style={{ flex: 1, fontSize: '14px', color: '#666' }}>
              Còn lại
            </span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>
              {remainingStorage.toFixed(2)} MB
            </span>
          </div>
        </div>

        {/* Storage Details */}
        {stats && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              <strong>Số file:</strong> {stats.fileCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>Số thư mục:</strong> {stats.folderCount}
            </div>
          </div>
        )}

        {/* Folder Structure Legend */}
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#262626' }}>
            Cấu trúc thư mục
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Session Level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderFilled style={{ fontSize: '16px', color: '#1890ff' }} />
              <span style={{ fontSize: '14px', color: '#262626' }}>
                <strong>Phiên thi:</strong> <span style={{ color: '#666' }}>Các kỳ thi đã tạo</span>
              </span>
            </div>

            {/* Email Level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
              <span style={{ fontSize: '14px', color: '#262626' }}>
                <strong>Email thí sinh:</strong> <span style={{ color: '#666' }}>Thư mục của từng sinh viên</span>
              </span>
            </div>

            {/* File Level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileFilled style={{ fontSize: '16px', color: '#faad14' }} />
              <span style={{ fontSize: '14px', color: '#262626' }}>
                <strong>Ảnh whitelist:</strong> <span style={{ color: '#666' }}>Ảnh xác thực khuôn mặt</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - File Tree */}
      <div style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <Button 
            type="default"
            icon={<FolderOutlined />}
            onClick={handleAddFolder}
          >
            Thêm thư mục
          </Button>
          <Button 
            type="default"
            icon={<FileOutlined />}
            onClick={handleAddFiles}
          >
            Thêm files
          </Button>
          <Button 
            type="text"
            danger
            disabled={selectedKeys.length === 0}
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            Xóa
          </Button>
        </div>

        {/* Tree View */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto'
        }}>
          {(statsLoading || filesLoading) ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
          ) : (
            <Tree
              showIcon
              selectedKeys={selectedKeys}
              onSelect={(keys) => {
                setSelectedKeys(keys);
              }}
              onDoubleClick={(e, node: any) => {
                if (node.isLeaf) {
                  const file = findFileByPath(files || [], node.key);
                  if (file && file.url) {
                    setPreviewImage(file.url);
                    setPreviewOpen(true);
                  } else {
                    message.error('Không tìm thấy URL ảnh');
                  }
                }
              }}
              treeData={treeData}
              switcherIcon={({ expanded }) => 
                expanded ? <FolderOpenOutlined /> : <FolderOutlined />
              }
              style={{
                fontSize: '14px'
              }}
              className="storage-tree"
            />
          )}
        </div>
        <style>{`
          .storage-tree .ant-tree-node-selected {
            background-color: #bae7ff !important;
            font-weight: 600 !important;
          }
          .storage-tree .ant-tree-node-selected .ant-tree-title {
            font-weight: 600 !important;
            color: #002766 !important;
          }
          .storage-tree .ant-tree-node-selected .ant-tree-iconEle {
            color: #0050b3 !important;
          }
          .storage-tree .ant-tree-node-selected .anticon {
            color: #0050b3 !important;
          }
        `}</style>
      </div>

      {/* Modal for Add Folder/Files */}
      <Modal
        title={modalType === 'folder' ? 'Thêm thư mục mới' : 'Thêm files'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={modalType === 'folder' ? 'Tạo' : 'Upload'}
        cancelText="Hủy"
      >
        {modalType === 'folder' ? (
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Tên thư mục:
            </label>
            <Input
              placeholder="Nhập tên thư mục"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onPressEnter={handleModalOk}
            />
          </div>
        ) : (
          <div>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Chọn files</Button>
            </Upload>
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Image
        width={0}
        style={{ display: 'none' }}
        preview={{
          visible: previewOpen,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewOpen(visible),
        }}
      />
    </div>
  );
};

export default ResultPage;