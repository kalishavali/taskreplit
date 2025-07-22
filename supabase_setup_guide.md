# Supabase Database Setup Guide

## 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `MuchBetter Project Management`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Plan**: Start with Free tier

## 2. Get Database Connection String

1. Once project is created, go to **Settings** → **Database**
2. Scroll down to **Connection string** → **Transaction** mode
3. Copy the connection string that looks like:
   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password you created

## 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire content from `supabase_setup.sql`
4. Click **Run** to execute the SQL

This will create:
- All required tables with proper relationships
- Indexes for performance optimization  
- Row Level Security (RLS) policies
- Sample data including MuchBetter client and projects
- Triggers for automatic timestamp updates

## 4. Configure Environment Variables

Update your `.env` file with the Supabase connection string:

```env
# Supabase Database Connection
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Session secret (generate a secure random string)
SESSION_SECRET=your_very_secure_session_secret_here

# Optional: Supabase specific variables
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 5. Verify Connection

1. Start your application: `npm run dev`
2. Check the console for: `🟢 Using Supabase PostgreSQL database`
3. Navigate to `http://localhost:5000` (if running locally) or your Replit URL
4. Login with:
   - **Username**: `admin`
   - **Password**: `password`

## 6. Row Level Security (RLS)

The setup includes basic RLS policies that allow:
- **All authenticated users** can view, insert, update, and delete data
- **Public read access** for most tables
- **User-specific access** for notifications and personal data

### Customizing RLS Policies

You can make policies more restrictive by modifying them in the Supabase SQL Editor:

```sql
-- Example: Only allow users to edit their assigned tasks
DROP POLICY "Authenticated users can update tasks" ON tasks;
CREATE POLICY "Users can update assigned tasks" ON tasks 
FOR UPDATE USING (auth.jwt() ->> 'sub' = assignee);

-- Example: Client-based access control
CREATE POLICY "Users can only see their client's projects" ON projects 
FOR SELECT USING (
  client_id IN (
    SELECT client_id FROM user_client_permissions 
    WHERE user_id = auth.uid() AND can_view = true
  )
);
```

## 7. Database Features Included

### Tables Created:
- ✅ **clients** - Client organizations (MuchBetter)
- ✅ **projects** - Client projects (Wallet, Corporate Card Wallet)  
- ✅ **applications** - App types (Mobile, Web, API, Desktop, Watch)
- ✅ **tasks** - Project tasks with rich content
- ✅ **comments** - Task comments with rich text
- ✅ **activities** - Activity logging
- ✅ **team_members** - Team member profiles
- ✅ **users** - Authentication users
- ✅ **user_client_permissions** - Role-based access control
- ✅ **sessions** - Session management
- ✅ **notifications** - User notifications
- ✅ **time_entries** - Time tracking

### Sample Data Included:
- **1 Client**: MuchBetter
- **2 Projects**: Wallet, Corporate Card Wallet  
- **5 Applications**: Mobile, Web, API, Desktop, Watch
- **15 Tasks**: Various tasks with different statuses
- **5 Team Members**: Sridevi, Kalisha, Shirish, Alex Johnson, Sarah Chen
- **4 Users**: admin, sridevi, kalisha, shirish (all with password: `password`)
- **Sample Comments and Activities**

## 8. Monitoring and Management

### Supabase Dashboard Features:
- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom queries
- **Authentication**: Manage users and auth settings  
- **Storage**: File uploads (if needed later)
- **Edge Functions**: Serverless functions (if needed)
- **Logs**: Monitor database queries and performance

### Performance Monitoring:
- Monitor slow queries in **Logs** → **Postgres Logs**
- Check connection usage in **Settings** → **Database**
- Set up alerts for high usage

## 9. Backup and Security

### Automatic Backups:
- Supabase automatically backs up your database
- Point-in-time recovery available on Pro plan

### Security Best Practices:
- Never share your database password
- Use RLS policies to restrict data access
- Monitor authentication logs
- Rotate service role keys periodically

## 10. Scaling Considerations

### Free Tier Limits:
- 2 projects maximum
- 500MB database storage
- 2GB bandwidth per month
- 50MB file storage

### Upgrading:
- **Pro Plan**: $25/month - Production workloads
- **Team Plan**: $599/month - Multiple team members
- **Enterprise**: Custom pricing - Enterprise features

## 11. Troubleshooting

### Common Issues:

**Connection refused:**
- Check if DATABASE_URL is correct
- Verify database password
- Ensure project is not paused (free tier)

**RLS Policy errors:**
- Verify authentication is working
- Check policy conditions
- Test with service role key for debugging

**Slow queries:**
- Check missing indexes
- Monitor in Supabase dashboard
- Consider query optimization

### Getting Help:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

1. ✅ Run the SQL setup in Supabase
2. ✅ Update your `.env` with Supabase DATABASE_URL  
3. ✅ Start your application and verify connection
4. ✅ Login and test all functionality
5. ✅ Customize RLS policies as needed
6. ✅ Set up monitoring and alerts

Your application will now use Supabase as the database backend with all existing functionality working seamlessly!