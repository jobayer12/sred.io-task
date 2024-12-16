import mongoose from 'mongoose';

export const MongooseObjectId = id => {
    return new mongoose.Types.ObjectId(id);
}

// Function to format filter into MongoDB query condition
export const FormatColumnFilter = (filterType, key, type, value) => {
    let condition;
  
    switch (filterType) {
      case 'date':
        condition = formatDateFilter(type, key, value);
        break;
        
      case 'number':
        condition = formatNumberFilter(type, key, value);
        break;
  
      case 'text':
        condition = formatTextFilter(type, key, value);
        break;
  
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }
  
    return condition;
  }

// Function to handle text filters (contains, equals, startsWith, endsWith)
export const formatTextFilter = (type, key, value) => {

    // Escape special characters for regex
    const escapeRegExp = (str) => {
        return str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&'); // Escape all special characters
    };

    if (['_id', 'integrationId', 'repositoryId', 'organizationId'].includes(key)) {
        return MongooseObjectId(value);
    }

    let condition;


    switch (type) {
        case 'contains':
            // Escape value to prevent regex issues
            const containsValue = escapeRegExp(value);
            condition = { $regex: containsValue, $options: 'i' };  // Case-insensitive match
            break;

        case 'equals':
            condition = { $eq: value };  // Exact match
            break;

        case 'startsWith':
            // Escape value to prevent regex issues
            const startsWithValue = escapeRegExp(value);
            condition = { $regex: `^${startsWithValue}`, $options: 'i' };  // Starts with (case-insensitive)
            break;

        case 'endsWith':
            // Escape value to prevent regex issues
            const endsWithValue = escapeRegExp(value);
            condition = { $regex: `${endsWithValue}$`, $options: 'i' };  // Ends with (case-insensitive)
            break;

        default:
            throw new Error(`Unsupported text filter type: ${type}`);
    }

    return condition;
}

export const formatNumberFilter = (type, key, value) => {
    let condition;
  
    switch (type) {
      case 'inRange':
        const [min, max] = value;
        condition = {
          $gte: +min,
          $lte: +max
        };
        break;
  
      case 'equals':
        condition = { $eq: +value };
        break;
  
      case 'lessThan':
        condition = { $lt: +value };
        break;
  
      case 'greaterThan':
        condition = { $gt: +value };
        break;
  
      default:
        throw new Error(`Unsupported number filter type: ${type}`);
    }
  
    return condition;
  }

export const formatDateFilter = (type, key, value) => {
    let condition;

    switch (type) {
        case 'inRange':
            // Ensure value is an array with two dates
            const [startDate, endDate] = value.map(date => new Date(date));
            condition = {
                $gte: startDate,
                $lte: endDate
            };
            break;

        case 'equals':
            condition = { $eq: value };
            break;

        case 'lessThan':
            condition = { $lt: value };
            break;

        case 'greaterThan':
            condition = { $gt: value };
            break;

        default:
            throw new Error(`Unsupported filter type: ${type}`);
    }
    return condition;
}