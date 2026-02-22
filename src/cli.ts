#!/usr/bin/env node

import { Command } from 'commander';
import { HuntrApi } from './api';
import { Member, Job, Activity, Tag } from './types';

const program = new Command();

program
  .name('huntr')
  .description('CLI tool for Huntr Organization API')
  .version('1.0.0');

// Members commands
const members = program.command('members').description('Manage organization members');

members
  .command('list')
  .description('List all organization members')
  .option('-l, --limit <number>', 'Number of results per page', '100')
  .option('-a, --all', 'Fetch all pages')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const api = new HuntrApi();
      
      if (options.all) {
        const allMembers: Member[] = [];
        for await (const page of api.members.listAll(parseInt(options.limit))) {
          allMembers.push(...page);
        }
        
        if (options.json) {
          console.log(JSON.stringify(allMembers, null, 2));
        } else {
          console.table(allMembers.map(m => ({
            ID: m.id,
            Name: `${m.givenName} ${m.familyName}`,
            Email: m.email,
            Active: m.isActive ? '✓' : '✗',
            Advisor: m.advisor?.fullName || 'N/A'
          })));
        }
      } else {
        const response = await api.members.list({ limit: parseInt(options.limit) });
        
        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
        } else {
          console.table(response.data.map(m => ({
            ID: m.id,
            Name: `${m.givenName} ${m.familyName}`,
            Email: m.email,
            Active: m.isActive ? '✓' : '✗',
            Advisor: m.advisor?.fullName || 'N/A'
          })));
          if (response.next) {
            console.log(`\nMore results available. Use --all to fetch all pages.`);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

members
  .command('get')
  .description('Get a specific member by ID')
  .argument('<id>', 'Member ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (id, options) => {
    try {
      const api = new HuntrApi();
      const member = await api.members.get(id);
      
      if (options.json) {
        console.log(JSON.stringify(member, null, 2));
      } else {
        console.log(`\nMember Details:`);
        console.log(`  ID: ${member.id}`);
        console.log(`  Name: ${member.givenName} ${member.familyName}`);
        console.log(`  Email: ${member.email}`);
        console.log(`  Active: ${member.isActive ? 'Yes' : 'No'}`);
        console.log(`  Created: ${new Date(member.createdAt * 1000).toLocaleString()}`);
        if (member.advisor) {
          console.log(`  Advisor: ${member.advisor.fullName} (${member.advisor.email})`);
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Jobs commands
const jobs = program.command('jobs').description('Manage jobs');

jobs
  .command('list')
  .description('List jobs')
  .option('-m, --member-id <id>', 'Filter by member ID')
  .option('-l, --limit <number>', 'Number of results per page', '100')
  .option('-a, --all', 'Fetch all pages')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const api = new HuntrApi();
      
      if (options.all) {
        const allJobs: Job[] = [];
        for await (const page of api.jobs.listAll(options.memberId, parseInt(options.limit))) {
          allJobs.push(...page);
        }
        
        if (options.json) {
          console.log(JSON.stringify(allJobs, null, 2));
        } else {
          console.table(allJobs.map(j => ({
            ID: j.id,
            Title: j.title,
            Employer: j.employerName || 'N/A',
            Location: j.location || 'N/A',
            Member: j.member ? `${j.member.givenName} ${j.member.familyName}` : 'N/A'
          })));
        }
      } else {
        const params: any = { limit: parseInt(options.limit) };
        if (options.memberId) {
          params.member_id = options.memberId;
        }
        
        const response = await api.jobs.list(params);
        
        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
        } else {
          console.table(response.data.map(j => ({
            ID: j.id,
            Title: j.title,
            Employer: j.employerName || 'N/A',
            Location: j.location || 'N/A',
            Member: j.member ? `${j.member.givenName} ${j.member.familyName}` : 'N/A'
          })));
          if (response.next) {
            console.log(`\nMore results available. Use --all to fetch all pages.`);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

jobs
  .command('get')
  .description('Get a specific job by ID')
  .argument('<id>', 'Job ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (id, options) => {
    try {
      const api = new HuntrApi();
      const job = await api.jobs.get(id);
      
      if (options.json) {
        console.log(JSON.stringify(job, null, 2));
      } else {
        console.log(`\nJob Details:`);
        console.log(`  ID: ${job.id}`);
        console.log(`  Title: ${job.title}`);
        console.log(`  Employer: ${job.employerName || 'N/A'}`);
        console.log(`  Location: ${job.location || 'N/A'}`);
        console.log(`  URL: ${job.url || 'N/A'}`);
        if (job.salary) {
          console.log(`  Salary: ${job.salary.min || 'N/A'} - ${job.salary.max || 'N/A'} ${job.salary.currency || ''}`);
        }
        console.log(`  Created: ${new Date(job.createdAt * 1000).toLocaleString()}`);
        if (job.member) {
          console.log(`  Member: ${job.member.givenName} ${job.member.familyName}`);
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Activities commands
const activities = program.command('activities').description('Manage activities');

activities
  .command('list')
  .description('List activities')
  .option('-m, --member-id <id>', 'Filter by member ID')
  .option('-l, --limit <number>', 'Number of results per page', '100')
  .option('-a, --all', 'Fetch all pages')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const api = new HuntrApi();
      
      if (options.all) {
        const allActivities: Activity[] = [];
        for await (const page of api.activities.listAll(options.memberId, parseInt(options.limit))) {
          allActivities.push(...page);
        }
        
        if (options.json) {
          console.log(JSON.stringify(allActivities, null, 2));
        } else {
          console.table(allActivities.map(a => ({
            ID: a.id,
            Title: a.title,
            Category: a.category?.name || 'N/A',
            Created: new Date(a.createdAt * 1000).toLocaleDateString(),
            Completed: a.completedAt ? new Date(a.completedAt * 1000).toLocaleDateString() : 'Not completed',
            Member: a.member ? `${a.member.givenName} ${a.member.familyName}` : 'N/A'
          })));
        }
      } else {
        const params: any = { limit: parseInt(options.limit) };
        if (options.memberId) {
          params.member_id = options.memberId;
        }
        
        const response = await api.activities.list(params);
        
        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
        } else {
          console.table(response.data.map(a => ({
            ID: a.id,
            Title: a.title,
            Category: a.category?.name || 'N/A',
            Created: new Date(a.createdAt * 1000).toLocaleDateString(),
            Completed: a.completedAt ? new Date(a.completedAt * 1000).toLocaleDateString() : 'Not completed',
            Member: a.member ? `${a.member.givenName} ${a.member.familyName}` : 'N/A'
          })));
          if (response.next) {
            console.log(`\nMore results available. Use --all to fetch all pages.`);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Tags commands
const tags = program.command('tags').description('Manage tags');

tags
  .command('list')
  .description('List all tags')
  .option('-l, --limit <number>', 'Number of results per page', '100')
  .option('-a, --all', 'Fetch all pages')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const api = new HuntrApi();
      
      if (options.all) {
        const allTags: Tag[] = [];
        for await (const page of api.tags.listAll(parseInt(options.limit))) {
          allTags.push(...page);
        }
        
        if (options.json) {
          console.log(JSON.stringify(allTags, null, 2));
        } else {
          console.table(allTags.map(t => ({
            ID: t.id,
            Name: t.name,
            Color: t.color || 'N/A',
            Created: new Date(t.createdAt * 1000).toLocaleDateString()
          })));
        }
      } else {
        const response = await api.tags.list({ limit: parseInt(options.limit) });
        
        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
        } else {
          console.table(response.data.map(t => ({
            ID: t.id,
            Name: t.name,
            Color: t.color || 'N/A',
            Created: new Date(t.createdAt * 1000).toLocaleDateString()
          })));
          if (response.next) {
            console.log(`\nMore results available. Use --all to fetch all pages.`);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

tags
  .command('create')
  .description('Create a new tag')
  .argument('<name>', 'Tag name')
  .option('-t, --target <object>', 'Target object type')
  .option('-j, --json', 'Output as JSON')
  .action(async (name, options) => {
    try {
      const api = new HuntrApi();
      const tag = await api.tags.create(name, options.target);
      
      if (options.json) {
        console.log(JSON.stringify(tag, null, 2));
      } else {
        console.log(`\n✓ Tag created successfully`);
        console.log(`  ID: ${tag.id}`);
        console.log(`  Name: ${tag.name}`);
        if (tag.color) {
          console.log(`  Color: ${tag.color}`);
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
