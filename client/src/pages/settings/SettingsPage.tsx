import { useEffect, useMemo, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Upload,
  Typography,
  Divider,
  Popconfirm,
} from "antd";
import { UploadOutlined, SettingOutlined } from "@ant-design/icons";
import PageTemplate from "../../components/PageTemplate";
import {
  getSettings,
  updateProfile,
  updateAccount,
  updatePassword,
  updateNotifications,
  updatePreferences,
  deleteAccount,
  type UserSettings,
} from "../../services/settingsService";
import { useThemeStore } from "../../store/themeStore";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserSettings | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getSettings();
        if (!mounted) return;
        setData(res);
        setAvatarPreview(res.profile.avatarUrl);
      } catch (e: any) {
        message.error(e?.message ?? "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [message]);

  const tabItems = useMemo(
    () => [
      {
        key: "profile",
        label: "Profile",
        children: (
          <ProfileTab
            loading={loading}
            data={data}
            avatarPreview={avatarPreview}
            setAvatarPreview={setAvatarPreview}
          />
        ),
      },
      {
        key: "account",
        label: "Account",
        children: <AccountTab loading={loading} data={data} />,
      },
      { key: "security", label: "Security", children: <SecurityTab /> },
      {
        key: "notifications",
        label: "Notifications",
        children: <NotificationsTab loading={loading} data={data} />,
      },
      {
        key: "preferences",
        label: "Preferences",
        children: <PreferencesTab loading={loading} data={data} />,
      },
      { key: "danger", label: "Danger zone", children: <DangerTab /> },
    ],
    [loading, data, avatarPreview]
  );

  return (
    <PageTemplate
      title={
        <span className="flex items-center gap-2">
          <SettingOutlined /> Settings
        </span>
      }
      subtitle="Manage your profile, security, notifications, and preferences."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
      actions={null}
      user={
        data
          ? {
              name: data.profile.fullName,
              role: data.profile.role,
              avatarUrl: data.profile.avatarUrl,
            }
          : undefined
      }
    >
      <Card className="max-w-5xl">
        {loading && <Skeleton active paragraph={{ rows: 6 }} />}
        {!loading && data && <Tabs items={tabItems} />}
      </Card>
    </PageTemplate>
  );
}

function ProfileTab({
  loading,
  data,
  avatarPreview,
  setAvatarPreview,
}: {
  loading: boolean;
  data: UserSettings | null;
  avatarPreview?: string;
  setAvatarPreview: (v?: string) => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      fullName: data.profile.fullName,
      headline: data.profile.headline,
      role: data.profile.role,
    });
  }, [data, form]);

  const beforeUpload = (file: File) => {
    // preview
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
    // prevent auto upload by AntD, we’ll send in onFinish
    return false;
  };

  const onFinish = async () => {
    try {
      await updateProfile();
      message.success("Profile updated");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update profile");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Profile
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card>
            <div className="flex flex-col items-center gap-4">
              <Avatar
                size={96}
                src={avatarPreview}
                className="ring-2 ring-white shadow"
              />
              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={beforeUpload}
              >
                <Button icon={<UploadOutlined />}>Change avatar</Button>
              </Upload>
              <Text type="secondary" className="text-center">
                PNG/JPG/SVG. Recommended 256×256.
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              disabled={loading}
              requiredMark={false}
            >
              <Form.Item
                label="Full name"
                name="fullName"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input className="w-full" />
              </Form.Item>
              <Form.Item label="Headline / Title" name="headline">
                <Input placeholder="e.g., Senior Lecturer / Student" />
              </Form.Item>
              <Form.Item label="Role" name="role">
                <Input disabled />
              </Form.Item>
              <div className="flex items-center justify-end gap-2">
                <Button htmlType="reset">Reset</Button>
                <Button type="primary" htmlType="submit">
                  Save changes
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function AccountTab({
  loading,
  data,
}: {
  loading: boolean;
  data: UserSettings | null;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      email: data.account.email,
      username: data.account.username,
    });
  }, [data, form]);

  const onFinish = async () => {
    try {
      await updateAccount();
      message.success("Account updated");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update account");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Account
      </Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          requiredMark={false}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Username is required" }]}
          >
            <Input />
          </Form.Item>
          <div className="flex items-center justify-end gap-2">
            <Button htmlType="reset">Reset</Button>
            <Button type="primary" htmlType="submit">
              Save changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (values.newPassword !== values.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      await updatePassword();
      form.resetFields();
      message.success("Password updated");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Security
      </Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
          disabled={loading}
        >
          <Form.Item
            label="Current password"
            name="currentPassword"
            rules={[{ required: true, message: "Enter current password" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              { required: true, message: "Enter new password" },
              { min: 8, message: "At least 8 characters" },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirm password"
            name="confirmPassword"
            rules={[{ required: true, message: "Confirm your new password" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <div className="flex items-center justify-end gap-2">
            <Button htmlType="reset">Reset</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update password
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

function NotificationsTab({
  loading,
  data,
}: {
  loading: boolean;
  data: UserSettings | null;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      emailAnnouncements: data.notifications.emailAnnouncements,
      emailReminders: data.notifications.emailReminders,
      pushMentions: data.notifications.pushMentions,
      pushGrades: data.notifications.pushGrades,
    });
  }, [data, form]);

  const onFinish = async () => {
    try {
      await updateNotifications();
      message.success("Notification preferences saved");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update notifications");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Notifications
      </Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          requiredMark={false}
        >
          <Row gutter={[24, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email: Announcements"
                name="emailAnnouncements"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Email: Exam reminders"
                name="emailReminders"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Push: Mentions & replies"
                name="pushMentions"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Push: Grades published"
                name="pushGrades"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex items-center justify-end gap-2">
            <Button htmlType="reset">Reset</Button>
            <Button type="primary" htmlType="submit">
              Save changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

function PreferencesTab({
  loading,
  data,
}: {
  loading: boolean;
  data: UserSettings | null;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      theme: data.preferences.theme,
      language: data.preferences.language,
      timezone: data.preferences.timezone,
      dateFormat: data.preferences.dateFormat,
    });
    setTheme(data.preferences.theme);
  }, [data, form, setTheme]);

  const onFinish = async (values: any) => {
    try {
      await updatePreferences();
      setTheme(values.theme);
      message.success("Preferences updated");
    } catch (e: any) {
      message.error(e?.message ?? "Could not update preferences");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Preferences
      </Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          requiredMark={false}
        >
          <Row gutter={[24, 12]}>
            <Col xs={24} md={12}>
              <Form.Item label="Theme" name="theme">
                <Select
                  options={[
                    { label: "System", value: "system" },
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" },
                  ]}
                  onChange={setTheme}
                />
              </Form.Item>
              <Form.Item label="Language" name="language">
                <Select
                  options={[
                    { label: "English", value: "en" },
                    { label: "Español", value: "es" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Time zone" name="timezone">
                <Select
                  showSearch
                  options={[
                    {
                      label: "America/La_Paz (UTC-4)",
                      value: "America/La_Paz",
                    },
                    { label: "UTC", value: "UTC" },
                    {
                      label: "America/New_York (UTC-5/−4)",
                      value: "America/New_York",
                    },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Date format" name="dateFormat">
                <Select
                  options={[
                    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
                    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
                    { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex items-center justify-end gap-2">
            <Button htmlType="reset">Reset</Button>
            <Button type="primary" htmlType="submit">
              Save changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

function DangerTab() {
  const { message } = App.useApp();

  const onDelete = async () => {
    try {
      await deleteAccount();
      message.success("Account scheduled for deletion");
    } catch (e: any) {
      message.error(e?.message ?? "Could not delete account");
    }
  };

  return (
    <div className="space-y-6">
      <Title level={4} className="!m-0">
        Danger zone
      </Title>
      <Card>
        <Text type="secondary">
          Deleting your account removes personal data and access. This action
          may be irreversible.
        </Text>
        <Divider />
        <Popconfirm
          title="Delete account?"
          description="This cannot be undone."
          okType="danger"
          okText="Delete"
          onConfirm={onDelete}
        >
          <Button danger>Delete my account</Button>
        </Popconfirm>
      </Card>
    </div>
  );
}
